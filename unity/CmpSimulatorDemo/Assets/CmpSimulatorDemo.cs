using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.Networking;

[Serializable] public class CmpMeasurement {
    public string wafer_id, recipe, wafer_started_at, measurement_completed_at;
    public double mrr;
}
[Serializable] public class CmpRequest {
    public string wafer_id, recipe, pressure_scenario, wafer_start_at;
    public CmpMeasurement[] history;
}
[Serializable] public class CmpWarning { public string code, message; }
[Serializable] public class CmpError { public string code, message; }
[Serializable] public class CmpPrediction {
    public string status, recipe, pressure_scenario, model_version, time_status, support_level, correction_status;
    public double base_mrr, applied_correction, final_mrr;
    public bool correction_enabled;
    public int history_used;
    public CmpWarning[] warnings;
    public CmpError error;
}
[Serializable] public class CmpHealth { public bool ready, independent_final_test; public string usage, model_version; }
[Serializable] public class CmpScenario { public string recipe, pressure_scenario, support_level, correction_status; public bool correction_enabled; }
[Serializable] public class CmpScenarios { public CmpScenario[] items; }
[Serializable] public class CmpSmokeReport {
    public string status, model_version, history_origin, time_status, artifact_usage;
    public double first_mrr, after_measurement_mrr;
    public bool health, scenario_registry, first_prediction, correction_disabled, time_disabled,
        measurement_updates_prediction, unsupported_rejected, insufficient_history_rejected;
    public string error;
}

public sealed class CmpSimulatorDemo : MonoBehaviour {
    string baseUrl = "http://127.0.0.1:8765", recipe = "B456", scenario = "Normal";
    string status = "API에 연결하는 중", input = "78", inputError = "", importPath = "", source = "교육용 합성 예시";
    bool busy, ready;
    int step;
    CmpPrediction prediction;
    CmpScenario[] registry = Array.Empty<CmpScenario>();
    readonly List<CmpMeasurement> history = new List<CmpMeasurement>();
    DateTime origin = new DateTime(2026, 10, 11, 0, 0, 0, DateTimeKind.Utc);
    GUIStyle title, heading, text, muted, warning, field, button, number;
    Vector2 warningScroll;

    IEnumerator Start() {
        Application.targetFrameRate = 30;
        string[] args = Environment.GetCommandLineArgs();
        int port = Array.IndexOf(args, "-cmp-port");
        if (port >= 0 && port + 1 < args.Length && int.TryParse(args[port+1], out int parsed) && parsed > 0 && parsed <= 65535)
            baseUrl = "http://127.0.0.1:" + parsed;
        Seed();
        yield return Connect();
        if (args.Contains("-cmp-smoke")) yield return Smoke(args);
    }

    string Stamp(DateTime value) => value.ToUniversalTime().ToString("o", CultureInfo.InvariantCulture);
    DateTime CurrentStart => origin.AddSeconds(10 + step * 10);
    CmpRequest Request() => new CmpRequest { wafer_id = "demo-" + (step+3) + ":" + recipe,
        recipe = recipe, pressure_scenario = scenario, wafer_start_at = Stamp(CurrentStart), history = history.ToArray() };

    void Seed() {
        source = "교육용 합성 예시"; step = 0; history.Clear(); prediction = null; inputError = "";
        history.Add(new CmpMeasurement { wafer_id = "demo-1:"+recipe, recipe = recipe,
            wafer_started_at = Stamp(origin), measurement_completed_at = Stamp(origin.AddSeconds(1)), mrr = 60 });
        history.Add(new CmpMeasurement { wafer_id = "demo-2:"+recipe, recipe = recipe,
            wafer_started_at = Stamp(origin.AddSeconds(2)), measurement_completed_at = Stamp(origin.AddSeconds(3)), mrr = 80 });
    }

    IEnumerator Send(string path, string method, string json, Action<long,string> done) {
        using (var request = new UnityWebRequest(baseUrl+path, method)) {
            request.downloadHandler = new DownloadHandlerBuffer(); request.timeout = 10;
            if (json != null) {
                request.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(json));
                request.SetRequestHeader("Content-Type", "application/json");
            }
            yield return request.SendWebRequest();
            done(request.responseCode, request.downloadHandler.text);
        }
    }

    IEnumerator Connect() {
        busy = true; ready = false;
        yield return Send("/api/v1/health", "GET", null, (code, body) => {
            var health = code == 200 ? JsonUtility.FromJson<CmpHealth>(body) : null;
            ready = health != null && health.ready && health.usage == "EDUCATIONAL_DEVELOPMENT_ONLY" && !health.independent_final_test;
        });
        if (ready) yield return Send("/api/v1/scenarios", "GET", null, (code,body) => {
            if (code == 200) registry = JsonUtility.FromJson<CmpScenarios>(body).items;
            ready = registry != null && registry.Length == 5 && registry.All(x => !x.correction_enabled);
        });
        status = ready ? "교육용 Ridge 연결 완료" : "연결 실패 · API 실행 후 다시 연결하세요";
        busy = false;
        if (ready) yield return imported==null ? Predict() : PredictImported(imported);
    }

    IEnumerator Predict() {
        busy = true; prediction = null; inputError = "";
        yield return Send("/api/v1/predictions", "POST", JsonUtility.ToJson(Request()), (code,body) => {
            if (string.IsNullOrEmpty(body)) { status = "API 응답 없음 · 연결을 확인하세요"; return; }
            try {
                var result = JsonUtility.FromJson<CmpPrediction>(body);
                if (code == 200 && result.status == "OK") { prediction = result; status = "예측 완료"; }
                else status = result.error == null ? "예측 오류" : result.error.code + " · " + result.error.message;
            } catch (Exception) { status = "응답 형식을 확인할 수 없습니다"; }
        });
        busy = false;
    }

    bool AddMeasurement() {
        if (!double.TryParse(input, NumberStyles.Float, CultureInfo.InvariantCulture, out double value) || double.IsNaN(value) || double.IsInfinity(value)) {
            inputError = "측정된 MRR을 유한한 숫자로 입력하세요."; return false;
        }
        var request = Request();
        history.Add(new CmpMeasurement { wafer_id = request.wafer_id, recipe = recipe,
            wafer_started_at = request.wafer_start_at, measurement_completed_at = Stamp(CurrentStart.AddSeconds(1)), mrr = value });
        step++; prediction = null;
        source = "합성 초기 이력 + 사용자가 입력한 측정값"; inputError = "";
        return true;
    }

    void ImportHistory() {
        try {
            string raw=File.ReadAllText(importPath);
            var data = JsonUtility.FromJson<CmpRequest>(raw);
            if (data == null || data.history == null || !registry.Any(x => x.recipe == data.recipe && x.pressure_scenario == data.pressure_scenario))
                throw new Exception("지원되는 recipe/scenario와 history가 필요합니다");
            var start = DateTimeOffset.Parse(data.wafer_start_at, CultureInfo.InvariantCulture).UtcDateTime;
            // Preserve the external execution ID for this prediction via an override.
            imported = data; importedRaw=raw; history.Clear(); history.AddRange(data.history); recipe = data.recipe; scenario = data.pressure_scenario;
            origin = start.AddSeconds(-10); step = 0; prediction = null;
            source = "사용자 제공 JSON 이력"; inputError = "";
            StartCoroutine(PredictImported(data));
        } catch (Exception error) { imported = null; inputError = "불러오기 실패: " + error.Message; }
    }
    CmpRequest imported;
    string importedRaw;
    IEnumerator PredictImported(CmpRequest data) {
        busy = true; prediction = null;
        // Pass external JSON unchanged so the Python boundary can reject unknown
        // fields instead of JsonUtility silently removing them.
        yield return Send("/api/v1/predictions", "POST", importedRaw, (code, body) => {
            var result = string.IsNullOrEmpty(body) ? null : JsonUtility.FromJson<CmpPrediction>(body);
            if (code == 200 && result != null && result.status == "OK") { prediction = result; status = "입력 JSON 예측 완료"; }
            else status = result != null && result.error != null ? result.error.code + " · " + result.error.message : "JSON 예측 실패";
        });
        busy = false;
    }

    void Styles() {
        if (title != null) return;
        Font font = Font.CreateDynamicFontFromOSFont(new[] { "Malgun Gothic", "Arial" }, 18);
        GUIStyle Make(int size, Color color, bool bold=false) {
            var s = new GUIStyle(GUI.skin.label) { font=font, fontSize=size, wordWrap=true, fontStyle=bold?FontStyle.Bold:FontStyle.Normal };
            s.normal.textColor=color; return s;
        }
        title=Make(30, Color.white, true); heading=Make(19, Color.white, true); text=Make(16, new Color(.86f,.9f,.95f));
        muted=Make(14,new Color(.6f,.7f,.8f)); warning=Make(14,new Color(1f,.78f,.46f)); number=Make(48,new Color(.3f,.88f,.75f),true);
        field=new GUIStyle(GUI.skin.textField) { font=font,fontSize=16,fixedHeight=34 };
        button=new GUIStyle(GUI.skin.button) { font=font,fontSize=16,fixedHeight=36 };
    }

    void OnGUI() {
        Styles();
        GUI.matrix=Matrix4x4.Scale(new Vector3(Screen.width/1280f,Screen.height/850f,1));
        GUI.color=new Color(.03f,.05f,.08f); GUI.DrawTexture(new Rect(0,0,1280,850),Texture2D.whiteTexture);
        GUI.color=new Color(.065f,.09f,.135f);
        GUI.DrawTexture(new Rect(16,145,432,688),Texture2D.whiteTexture);
        GUI.DrawTexture(new Rect(458,145,802,688),Texture2D.whiteTexture);
        GUI.color=new Color(.3f,.85f,.72f); GUI.DrawTexture(new Rect(32,99,1210,2),Texture2D.whiteTexture);
        GUI.color=Color.white;
        GUI.Label(new Rect(32,20,1210,46),"CMP · 측정 이력 기반 MRR 실험실",title);
        GUI.Label(new Rect(32,70,1210,30),"실제 PHM 학습 Ridge · 교육용 개발 모델 · 독립 최종 성능 미검증",warning);
        GUI.Label(new Rect(32,110,1210,30),status,text);
        GUILayout.BeginArea(new Rect(32,160,400,650));
        GUILayout.Label("공정과 측정 이력",heading); GUILayout.Space(14);
        GUI.enabled=!busy && imported==null;
        GUILayout.BeginHorizontal();
        foreach (string r in new[]{"A456","B456"}) if (GUILayout.Toggle(recipe==r,r,button) && recipe!=r) {
            recipe=r; scenario="Normal"; imported=null; Seed();
        }
        GUILayout.EndHorizontal(); GUILayout.Space(12);
        GUILayout.Label("관측 압력 시나리오",text); GUILayout.BeginHorizontal();
        foreach (string s in registry.Where(x=>x.recipe==recipe).Select(x=>x.pressure_scenario))
            if (GUILayout.Toggle(scenario==s,s,button) && scenario!=s) { scenario=s; prediction=null; if(imported!=null) imported.pressure_scenario=s; }
        GUILayout.EndHorizontal();
        GUI.enabled=!busy;
        GUILayout.Label("시나리오는 관측 범주입니다. 보정이 비활성이므로 선택만 바꿔도 MRR은 같습니다.",muted);
        GUILayout.Space(18); GUILayout.Label("이력: "+source,warning);
        GUILayout.Label("기록 "+history.Count+"개 · 같은 recipe의 측정 완료 이력만 사용",text);
        GUILayout.Space(10); GUILayout.Label("현재 웨이퍼에서 측정한 MRR",text); input=GUILayout.TextField(input,field);
        GUI.enabled=!busy && imported==null;
        if(GUILayout.Button("측정 완료 → 다음 웨이퍼",button) && AddMeasurement()) StartCoroutine(Predict());
        GUI.enabled=!busy;
        if(!string.IsNullOrEmpty(inputError)) GUILayout.Label(inputError,warning);
        GUILayout.BeginHorizontal();
        GUI.enabled=!busy&&ready;
        if(GUILayout.Button("예측",button)) StartCoroutine(imported==null?Predict():PredictImported(imported));
        GUI.enabled=!busy;
        if(GUILayout.Button("합성 이력 초기화",button)) { imported=null; Seed(); }
        GUILayout.EndHorizontal();
        if(GUILayout.Button("API 다시 연결",button)) StartCoroutine(Connect());
        GUILayout.Space(16); GUILayout.Label("외부 요청 JSON 파일 경로",muted); importPath=GUILayout.TextField(importPath,field);
        if(GUILayout.Button("JSON 불러와 예측",button)) ImportHistory();
        GUI.enabled=true; GUILayout.EndArea();
        GUILayout.BeginArea(new Rect(475,160,770,650));
        GUILayout.Label("예측 결과",heading); GUILayout.Space(10);
        if(prediction!=null) {
            GUILayout.Label(prediction.final_mrr.ToString("F3",CultureInfo.InvariantCulture),number);
            GUILayout.Label("MRR 원본 수치 척도 · 물리 단위 미확정",muted);
            GUILayout.Space(12); GUILayout.Label("기본 MRR  "+prediction.base_mrr.ToString("F3")+"    보정  "+prediction.applied_correction.ToString("F1"),text);
            GUILayout.Label("사용된 이력 "+prediction.history_used+"개    근거 "+prediction.support_level,text);
            GUILayout.Label("권장 연마 시간: 계산 비활성 ("+prediction.time_status+")",warning);
            GUILayout.Space(12); GUILayout.Label("모델: "+prediction.model_version,muted);
            GUILayout.Space(18); GUILayout.Label("해석 시 확인할 사항",heading);
            warningScroll=GUILayout.BeginScrollView(warningScroll,GUILayout.Height(310));
            foreach(var w in prediction.warnings??Array.Empty<CmpWarning>()) { GUILayout.Label(w.message,warning); GUILayout.Space(10); }
            GUILayout.EndScrollView();
        } else GUILayout.Label("공정을 선택하고 예측을 실행하세요. 측정 이력이 없으면 값을 임의로 생성하지 않습니다.",text);
        GUILayout.EndArea();
    }

    IEnumerator Smoke(string[] args) {
        var report=new CmpSmokeReport { health=ready,scenario_registry=registry.Length==5,
            history_origin="synthetic demo history; real PHM fitted model",artifact_usage="EDUCATIONAL_DEVELOPMENT_ONLY" };
        if(prediction!=null) {
            report.first_prediction=prediction.status=="OK" && prediction.warnings.Any(x=>x.code=="EDUCATIONAL_DEVELOPMENT_MODEL")
                && !prediction.warnings.Any(x=>x.code=="TEST_STUB_ONLY");
            report.model_version=prediction.model_version; report.first_mrr=prediction.final_mrr;
            report.correction_disabled=!prediction.correction_enabled&&prediction.applied_correction==0&&prediction.final_mrr==prediction.base_mrr;
            report.time_status=prediction.time_status; report.time_disabled=prediction.time_status=="UNIT_UNVERIFIED";
            input="78"; AddMeasurement(); yield return Predict();
            if(prediction!=null) { report.after_measurement_mrr=prediction.final_mrr; report.measurement_updates_prediction=Math.Abs(report.after_measurement_mrr-report.first_mrr)>1e-6; }
        }
        var bad=Request(); bad.recipe="A456"; bad.pressure_scenario="High";
        yield return Send("/api/v1/predictions","POST",JsonUtility.ToJson(bad),(code,body)=>{
            var r=JsonUtility.FromJson<CmpPrediction>(body); report.unsupported_rejected=code==422&&r.error.code=="UNSUPPORTED_PRESSURE_SCENARIO";
        });
        var empty=Request(); empty.history=Array.Empty<CmpMeasurement>();
        yield return Send("/api/v1/predictions","POST",JsonUtility.ToJson(empty),(code,body)=>{
            var r=JsonUtility.FromJson<CmpPrediction>(body); report.insufficient_history_rejected=code==422&&r.error.code=="INSUFFICIENT_HISTORY";
        });
        report.status=report.health&&report.scenario_registry&&report.first_prediction&&report.correction_disabled&&report.time_disabled
            &&report.measurement_updates_prediction&&report.unsupported_rejected&&report.insufficient_history_rejected?"PASS":"FAIL";
        string path=Path.GetFullPath("unity-smoke.json");
        int output=Array.IndexOf(args,"-cmp-report"); if(output>=0&&output+1<args.Length) path=Path.GetFullPath(args[output+1]);
        Directory.CreateDirectory(Path.GetDirectoryName(path)); File.WriteAllText(path,JsonUtility.ToJson(report,true));
        Debug.Log("CMP_UNITY_SMOKE "+report.status);
        Application.Quit(report.status=="PASS"?0:1);
    }
}
