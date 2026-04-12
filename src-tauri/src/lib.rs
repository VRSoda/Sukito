use tauri_plugin_autostart::MacosLauncher;
use tauri::{Manager, Runtime};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};
use tauri_plugin_opener::OpenerExt;
use serde::{Serialize, Deserialize};
use winreg::enums::*;
use winreg::RegKey;
use std::fs;
use std::path::PathBuf;
use std::net::TcpListener;
use sha2::{Sha256, Digest};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use rand::Rng;

#[derive(Serialize, Deserialize, Clone)]
pub struct WeatherData {
    temp: f32,
    icon: String,
    description: String,
    timezone: String, // 추가: IP 기반 타임존
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Task {
    id: String,
    #[serde(rename = "googleEventId")]
    google_event_id: Option<String>,
    text: String,
    time: String,
    day: String,
    date: Option<String>,
    #[serde(rename = "isRecurring")]
    is_recurring: bool,
    #[serde(rename = "recurrenceType")]
    recurrence_type: Option<String>,
}

fn get_tasks_path<R: Runtime>(app_handle: &tauri::AppHandle<R>) -> PathBuf {
    let mut path = app_handle.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
    if !path.exists() { let _ = fs::create_dir_all(&path); }
    path.push("tasks.json");
    path
}

#[tauri::command]
async fn get_tasks(app_handle: tauri::AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let path = get_tasks_path(&app_handle);
    if !path.exists() { return Ok(vec![]); }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let tasks: Vec<serde_json::Value> = serde_json::from_str(&content).unwrap_or_else(|_| vec![]);
    Ok(tasks)
}

#[tauri::command]
async fn save_tasks(app_handle: tauri::AppHandle, tasks: Vec<serde_json::Value>) -> Result<(), String> {
    let path = get_tasks_path(&app_handle);
    let content = serde_json::to_string_pretty(&tasks).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_weather_data(lang: Option<String>, owm_api_key: String) -> Result<WeatherData, String> {
    let lang_code = lang.as_deref().unwrap_or("en");
    let client = reqwest::Client::builder().user_agent("Mozilla/5.0").build().map_err(|e| e.to_string())?;

    // 기본값 (IP API 실패 시)
    let mut lat = 37.5665; // Seoul
    let mut lon = 126.9780;
    let mut timezone = "Asia/Seoul".to_string();

    // IP 기반 위치 정보 조회 시도
    if let Ok(resp) = client.get("https://ip-api.com/json/").send().await {
        if let Ok(text) = resp.text().await {
            if !text.is_empty() {
                if let Ok(ip_resp) = serde_json::from_str::<serde_json::Value>(&text) {
                    lat = ip_resp["lat"].as_f64().unwrap_or(37.5665);
                    lon = ip_resp["lon"].as_f64().unwrap_or(126.9780);
                    timezone = ip_resp["timezone"].as_str().unwrap_or("Asia/Seoul").to_string();
                }
            }
        }
    }

    // OpenWeatherMap 날씨 데이터 조회
    let owm_url = format!(
        "https://api.openweathermap.org/data/2.5/weather?lat={}&lon={}&appid={}&units=metric&lang={}",
        lat, lon, owm_api_key, lang_code
    );

    let owm_data = async {
        let resp = client.get(&owm_url).send().await.ok()?;
        let json = resp.json::<serde_json::Value>().await.ok()?;
        if json["cod"].as_i64()? == 200 { Some(json) } else { None }
    }.await;

    let w = owm_data.ok_or("OpenWeatherMap API 호출 실패 (키 활성화 대기 중일 수 있음)")?;
    let temp = w["main"]["temp"].as_f64().unwrap_or(0.0) as f32;
    let code = w["weather"][0]["id"].as_i64().unwrap_or(800);
    let icon = match code {
        200..=299 => "CloudLightning",
        300..=399 | 500..=599 => "CloudRain",
        600..=699 => "CloudSnow",
        700..=799 => "Cloud",
        800 => "Sun",
        _ => "Cloud",
    };
    let description = w["weather"][0]["description"].as_str().unwrap_or("").to_string();
    Ok(WeatherData { temp, icon: icon.to_string(), description, timezone })
}

#[tauri::command]
fn set_always_on_top<R: Runtime>(window: tauri::Window<R>, always_on_top: bool) { 
    let _ = window.set_always_on_top(always_on_top); 
}

#[tauri::command]
async fn open_data_folder(app_handle: tauri::AppHandle) -> Result<(), String> {
    let path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    if !path.exists() { let _ = fs::create_dir_all(&path); }
    app_handle.opener().open_path(path.to_string_lossy().as_ref(), None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_system_language() -> String {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(intl) = hkcu.open_subkey("Control Panel\\International") {
        if let Ok(locale) = intl.get_value::<String, _>("LocaleName") {
            let lower = locale.to_lowercase();
            if lower.starts_with("ko") { return "ko".to_string(); }
            if lower.starts_with("ja") { return "ja".to_string(); }
        }
    }
    "en".to_string()
}

#[tauri::command]
fn get_system_accent_color() -> String {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(dwm) = hkcu.open_subkey("Software\\Microsoft\\Windows\\DWM") {
        if let Ok(accent) = dwm.get_value::<u32, _>("AccentColor") {
            let r = (accent & 0xFF) as u8;
            let g = ((accent >> 8) & 0xFF) as u8;
            let b = ((accent >> 16) & 0xFF) as u8;
            return format!("#{:02x}{:02x}{:02x}", r, g, b);
        }
    }
    "#3b82f6".to_string()
}

const GOOGLE_CLIENT_ID: &str = "899070082187-0lbd9aq9urpkhs13vs5qv8mgcaivg7bo.apps.googleusercontent.com";

#[tauri::command]
async fn google_refresh_token(refresh_token: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", GOOGLE_CLIENT_ID),
            ("refresh_token", refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json::<serde_json::Value>().await.map_err(|e| e.to_string())?;

    resp.get("access_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| format!("Token refresh failed: {}", resp))
}

#[tauri::command]
async fn google_oauth_login(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use tokio::net::TcpListener as TokioListener;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    // PKCE code_verifier 생성 (43~128자 랜덤 문자열)
    let code_verifier: String = rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(64)
        .map(char::from)
        .collect();

    // code_challenge = BASE64URL(SHA-256(code_verifier))
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let code_challenge = URL_SAFE_NO_PAD.encode(hasher.finalize());

    // 사용 가능한 랜덤 포트 찾기
    let port = {
        let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
        listener.local_addr().map_err(|e| e.to_string())?.port()
    };

    let redirect_uri = format!("http://127.0.0.1:{}", port);
    let scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly";

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&code_challenge={}&code_challenge_method=S256",
        GOOGLE_CLIENT_ID,
        urlencoding::encode(&redirect_uri),
        urlencoding::encode(scopes),
        code_challenge
    );

    // 브라우저에서 구글 로그인 페이지 열기
    app_handle.opener().open_url(&auth_url, None::<&str>).map_err(|e| e.to_string())?;

    // 로컬 서버로 OAuth 콜백 수신 대기 (최대 3분)
    let listener = TokioListener::bind(format!("127.0.0.1:{}", port)).await.map_err(|e| e.to_string())?;

    let (mut stream, _) = tokio::time::timeout(
        std::time::Duration::from_secs(180),
        listener.accept()
    ).await
    .map_err(|_| "로그인 시간 초과 (3분)".to_string())?
    .map_err(|e| e.to_string())?;

    // HTTP 요청 읽기
    let mut buf = [0u8; 8192];
    let n = stream.read(&mut buf).await.map_err(|e| e.to_string())?;
    let request = String::from_utf8_lossy(&buf[..n]);

    // "GET /?code=XXX&... HTTP/1.1" 에서 path 추출
    let path = request.lines().next()
        .and_then(|line| line.split_whitespace().nth(1))
        .ok_or("잘못된 HTTP 요청")?;

    // code 파라미터 추출 및 URL 디코딩
    let code_encoded = path.split('?').nth(1)
        .and_then(|query| {
            query.split('&')
                .find(|param| param.starts_with("code="))
                .map(|param| param.trim_start_matches("code=").to_string())
        })
        .ok_or("구글 인증 코드를 찾을 수 없어요")?;

    let code = urlencoding::decode(&code_encoded)
        .map_err(|e| e.to_string())?
        .into_owned();

    // 브라우저에 완료 페이지 표시
    let html = "<html><body style='font-family:sans-serif;text-align:center;padding:60px;background:#111;color:#fff'>\
        <h2 style='color:#4ade80'>✅ 로그인 완료!</h2>\
        <p style='color:#aaa'>이 탭을 닫고 앱으로 돌아가세요.</p>\
        <script>setTimeout(()=>window.close(),2000)</script>\
        </body></html>";
    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
        html.len(), html
    );
    let _ = stream.write_all(response.as_bytes()).await;
    drop(stream);

    // 인증 코드를 액세스 토큰 + 리프레시 토큰으로 교환
    let client = reqwest::Client::new();
    let token_resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", GOOGLE_CLIENT_ID),
            ("code", code.as_str()),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect_uri.as_str()),
            ("code_verifier", code_verifier.as_str()),
        ])
        .send().await.map_err(|e| e.to_string())?
        .json::<serde_json::Value>().await.map_err(|e| e.to_string())?;

    if token_resp.get("access_token").is_none() {
        return Err(format!("토큰 교환 실패: {}", token_resp));
    }

    Ok(token_resp)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--flag"])))
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Sukito")
                .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_weather_data,
            set_always_on_top,
            open_data_folder,
            get_system_language,
            get_system_accent_color,
            get_tasks,
            save_tasks,
            google_oauth_login,
            google_refresh_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}