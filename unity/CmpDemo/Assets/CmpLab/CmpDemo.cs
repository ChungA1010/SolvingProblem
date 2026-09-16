using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

namespace CmpLab
{
    public class CmpDemo : MonoBehaviour
    {
        CmpApiClient api;
        Variable[] variables = Array.Empty<Variable>();
        Scenario[] scenarios = Array.Empty<Scenario>();
        readonly Dictionary<string, double> values = new Dictionary<string, double>();
        readonly Dictionary<string, string> texts = new Dictionary<string, string>();
        Prediction prediction;
        WaferPrediction waferPrediction;
        Experiment[] experiments = Array.Empty<Experiment>();
        string stage = "A", scenarioId = "SCN-A-001", status = "API에 연결하는 중", error = "", saveName = "첫 CMP 실험";
        int page, datasetIndex, patternIndex = 1, brush = 2;
        int[] pixels;
        Texture2D waferTexture;
        bool busy, ready, dirty, confirmStage, interval;
        string pendingStage, saveKey;
        GUIStyle title, heading, label, muted, button, field, small, large;
        Font font;
        Vector2 scroll;
        static readonly Color Background = new Color(.035f, .055f, .10f);
        static readonly Color Panel = new Color(.07f, .10f, .16f);
        static readonly Color Teal = new Color(.24f, .85f, .72f);
        static readonly Color Amber = new Color(1f, .70f, .30f);

        IEnumerator Start()
        {
            Application.targetFrameRate = 60;
            api = gameObject.AddComponent<CmpApiClient>();
            var args = Environment.GetCommandLineArgs();
            int port = Array.IndexOf(args, "-cmp-port");
            if (port >= 0 && port + 1 < args.Length && int.TryParse(args[port + 1], out var number)) api.BaseUrl = "http://127.0.0.1:" + number;
            GenerateMap();
            yield return Connect();
            if (args.Contains("-cmp-smoke")) yield return Smoke();
        }

        IEnumerator Connect()
        {
            busy = true; error = "";
            yield return api.Send<Health>("/api/v1/health", "GET", null, r => { ready = r.data != null && r.data.ready; Check(r.error); });
            if (ready)
            {
                yield return api.Send<Items<Variable>>("/api/v1/variables", "GET", null, r => { if (r.data != null) variables = r.data.items; Check(r.error); });
                yield return api.Send<Items<Scenario>>("/api/v1/scenarios", "GET", null, r => { if (r.data != null) scenarios = r.data.items; Check(r.error); });
                ResetScenario(); status = "로컬 모델 준비 완료";
            }
            busy = false;
        }

        void Check(ApiError e) { if (e != null && !string.IsNullOrEmpty(e.code)) { error = e.code + " · " + e.message; status = "입력을 유지했습니다. 오류 내용을 확인하세요."; } }
        void ResetScenario()
        {
            var s = scenarios.FirstOrDefault(x => x.scenario_id == scenarioId && x.stage == stage);
            if (s == null) return;
            values.Clear(); texts.Clear();
            foreach (var v in s.defaults) { values[v.variable_id] = v.value; texts[v.variable_id] = v.value.ToString("F5", System.Globalization.CultureInfo.InvariantCulture); }
            dirty = false; prediction = null; error = "";
        }

        void SetStage(string next)
        {
            if (next == stage) return;
            if (dirty) { pendingStage = next; confirmStage = true; return; }
            stage = next; scenarioId = "SCN-" + stage + "-001"; ResetScenario();
        }

        PredictRequest Request() => new PredictRequest { stage = stage, scenario_id = scenarioId, include_interval = interval,
            overrides = values.Select(x => new OverrideValue { variable_id = x.Key, value = x.Value }).ToArray() };

        IEnumerator Predict()
        {
            busy = true; error = "";
            foreach (var item in texts)
            {
                if (!double.TryParse(item.Value, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out double val) || double.IsNaN(val) || double.IsInfinity(val))
                { error = "입력값은 유한한 숫자여야 합니다."; busy = false; yield break; }
                values[item.Key] = val;
            }
            yield return api.Send<Prediction>("/api/v1/predictions", "POST", Request(), r =>
            { if (r.data != null) { prediction = r.data; saveKey = Guid.NewGuid().ToString("N"); status = "예측 완료 · " + r.data.ood.level; } Check(r.error); });
            busy = false;
        }

        IEnumerator Classify()
        {
            busy = true; error = "";
            var body = new WaferRequest { dataset = datasetIndex == 0 ? "wm811k" : "mixedwm38", width = 52, height = 52, pixels = pixels };
            yield return api.Send<WaferPrediction>("/api/v1/wafer-predictions", "POST", body, r =>
            { if (r.data != null) { waferPrediction = r.data; saveKey = Guid.NewGuid().ToString("N"); status = "분류 완료"; } Check(r.error); });
            busy = false;
        }

        IEnumerator Save(string id)
        {
            busy = true; error = "";
            yield return api.Send<Experiment>("/api/v1/experiments", "POST", new SaveRequest { name = saveName, prediction_id = id }, r =>
            { if (r.data != null) status = "저장 완료 · " + r.data.name; Check(r.error); }, saveKey ?? Guid.NewGuid().ToString("N"));
            busy = false;
        }

        IEnumerator LoadExperiments()
        {
            busy = true;
            yield return api.Send<Items<Experiment>>("/api/v1/experiments?limit=50", "GET", null, r => { if (r.data != null) experiments = r.data.items; Check(r.error); });
            busy = false;
        }

        void GenerateMap()
        {
            pixels = new int[52 * 52]; var random = new System.Random(42);
            for (int y = 0; y < 52; y++) for (int x = 0; x < 52; x++)
            {
                float dx = (x - 25.5f) / 25, dy = (y - 25.5f) / 25, r = Mathf.Sqrt(dx * dx + dy * dy);
                if (r > .96f) continue;
                bool defect = patternIndex == 1 && r < .25f || patternIndex == 2 && r > .78f || patternIndex == 3 && Mathf.Abs(dx - dy * .55f) < .06f;
                if (patternIndex == 4) defect = r < .25f || r > .78f;
                pixels[y * 52 + x] = defect || random.NextDouble() < .012 ? 2 : 1;
            }
            RefreshTexture(); waferPrediction = null;
        }

        void RefreshTexture()
        {
            if (waferTexture == null) { waferTexture = new Texture2D(52, 52, TextureFormat.RGBA32, false); waferTexture.filterMode = FilterMode.Point; }
            Color[] colors = new Color[pixels.Length];
            for (int y = 0; y < 52; y++) for (int x = 0; x < 52; x++) colors[(51 - y) * 52 + x] = pixels[y * 52 + x] == 0 ? Panel : pixels[y * 52 + x] == 1 ? Teal : new Color(1f, .38f, .32f);
            waferTexture.SetPixels(colors); waferTexture.Apply();
        }

        void InitStyles()
        {
            if (font != null) return;
            font = Font.CreateDynamicFontFromOSFont(new[] { "Malgun Gothic", "Arial" }, 18);
            GUI.skin.font = font;
            label = new GUIStyle(GUI.skin.label) { fontSize = 17, wordWrap = true, normal = { textColor = Color.white } };
            title = new GUIStyle(label) { fontSize = 32, fontStyle = FontStyle.Bold };
            heading = new GUIStyle(label) { fontSize = 22, fontStyle = FontStyle.Bold };
            muted = new GUIStyle(label) { fontSize = 15, normal = { textColor = new Color(.62f, .70f, .81f) } };
            small = new GUIStyle(muted) { fontSize = 13 };
            large = new GUIStyle(title) { fontSize = 37, normal = { textColor = Teal } };
            button = new GUIStyle(GUI.skin.button) { fontSize = 16, padding = new RectOffset(12, 12, 8, 8) };
            field = new GUIStyle(GUI.skin.textField) { fontSize = 16, padding = new RectOffset(8, 8, 8, 8) };
        }

        void Box(Rect r, Color color) { Color old = GUI.color; GUI.color = color; GUI.DrawTexture(r, Texture2D.whiteTexture); GUI.color = old; }
        bool Button(Rect r, string text) => GUI.Button(r, text, button);

        void OnGUI()
        {
            InitStyles();
            float scale = Mathf.Min(Screen.width / 1440f, Screen.height / 900f);
            GUI.matrix = Matrix4x4.TRS(new Vector3((Screen.width - 1440 * scale) / 2, (Screen.height - 900 * scale) / 2), Quaternion.identity, Vector3.one * scale);
            Box(new Rect(0, 0, 1440, 900), Background);
            Box(new Rect(0, 0, 224, 900), Panel);
            GUI.Label(new Rect(26, 34, 180, 60), "CMP LAB", title);
            GUI.Label(new Rect(27, 97, 170, 50), "데이터로 살펴보는\n가상 실험실", muted);
            string[] tabs = { "01  제거율 실험", "02  웨이퍼 분류", "03  실험 기록" };
            for (int i = 0; i < tabs.Length; i++)
            {
                if (page == i) Box(new Rect(16, 190 + i * 62, 192, 50), new Color(.12f, .24f, .29f));
                if (Button(new Rect(24, 194 + i * 62, 176, 42), tabs[i])) { page = i; if (i == 2 && !busy) StartCoroutine(LoadExperiments()); }
            }
            GUI.Label(new Rect(26, 704, 173, 35), ready ? "●  LOCAL API" : "○  연결 대기", muted);
            GUI.Label(new Rect(26, 744, 173, 58), "연구 데모 v1.0\n모델은 이 PC에서 실행", small);
            if (Button(new Rect(24, 820, 176, 40), "서버 다시 연결") && !busy) StartCoroutine(Connect());
            GUI.Label(new Rect(260, 30, 930, 52), page == 0 ? "CMP 제거율 실험" : page == 1 ? "웨이퍼 결함 패턴 분류" : "저장한 실험", title);
            GUI.Label(new Rect(262, 87, 1110, 46), page == 0 ? "관측 지수를 바꾸고, 고정된 모델의 반응을 비교하세요." : page == 1 ? "웨이퍼 맵을 직접 편집하고 단일·복합 결함을 분류하세요." : "이 PC에 저장한 예측과 모델 버전을 다시 확인하세요.", muted);
            GUI.enabled = ready && !busy;
            if (page == 0) DrawMrr(); else if (page == 1) DrawWafer(); else DrawHistory();
            GUI.enabled = true;
            Box(new Rect(252, 766, 1158, 56), string.IsNullOrEmpty(error) ? Panel : new Color(.29f, .13f, .12f));
            GUI.Label(new Rect(270, 776, 1120, 43), busy ? "계산 중… 입력을 잠시 유지합니다." : string.IsNullOrEmpty(error) ? status : error, muted);
            GUI.Label(new Rect(263, 837, 1110, 53), "교육·연구용입니다. 실제 공정 단위, 인과 효과, 품질 개선을 보증하지 않습니다.\n웨이퍼 결함 분류와 제거율 예측은 서로 연결되지 않은 별도 모델입니다.", small);
            if (confirmStage)
            {
                Box(new Rect(425, 330, 590, 230), new Color(.13f, .18f, .26f));
                GUI.Label(new Rect(457, 361, 530, 70), "수정한 입력을 버리고 Stage를 변경할까요?", heading);
                if (Button(new Rect(458, 475, 238, 45), "현재 입력 유지")) confirmStage = false;
                if (Button(new Rect(716, 475, 260, 45), "버리고 Stage 변경")) { confirmStage = false; dirty = false; SetStage(pendingStage); }
            }
        }

        void DrawMrr()
        {
            Box(new Rect(252, 145, 465, 600), Panel); Box(new Rect(735, 145, 675, 600), Panel);
            GUI.Label(new Rect(277, 165, 180, 32), "실험 조건", heading);
            if (Button(new Rect(493, 160, 88, 39), stage == "A" ? "✓ A" : "A")) SetStage("A");
            if (Button(new Rect(590, 160, 88, 39), stage == "B" ? "✓ B" : "B")) SetStage("B");
            var list = scenarios.Where(x => x.stage == stage).ToArray();
            for (int i = 0; i < list.Length; i++)
            {
                if (Button(new Rect(278 + i % 2 * 207, 216 + i / 2 * 44, 198, 38), (list[i].scenario_id == scenarioId ? "✓ " : "") + list[i].label))
                { scenarioId = list[i].scenario_id; ResetScenario(); }
            }
            var controls = variables.Where(x => x.stage == stage).ToArray();
            for (int i = 0; i < controls.Length; i++)
            {
                var v = controls[i]; float y = 321 + i * 67;
                if (!values.ContainsKey(v.variable_id)) continue;
                GUI.Label(new Rect(278, y, 275, 28), v.label, label);
                string text = GUI.TextField(new Rect(570, y - 2, 105, 33), texts[v.variable_id], field);
                if (text != texts[v.variable_id]) { texts[v.variable_id] = text; dirty = true; prediction = null; }
                float value = GUI.HorizontalSlider(new Rect(280, y + 38, 396, 18), (float)values[v.variable_id], (float)v.observed_hard_min, (float)v.observed_hard_max);
                if (Mathf.Abs(value - (float)values[v.variable_id]) > 1e-5f)
                { values[v.variable_id] = value; texts[v.variable_id] = value.ToString("F5", System.Globalization.CultureInfo.InvariantCulture); dirty = true; prediction = null; }
            }
            if (Button(new Rect(278, 680, 130, 42), "초기화")) ResetScenario();
            if (Button(new Rect(422, 680, 252, 42), "제거율 예측 실행")) StartCoroutine(Predict());
            GUI.Label(new Rect(763, 165, 510, 33), "모델별 예측 결과", heading);
            interval = GUI.Toggle(new Rect(1123, 208, 250, 30), interval, "  실측 기반 90% 구간 표시");
            GUI.Label(new Rect(763, 208, 350, 30), prediction == null ? "입력을 설정한 뒤 예측을 실행하세요." : "분포 검사: " + prediction.ood.level.ToUpper(), muted);
            if (prediction != null && prediction.model_results != null)
            {
                for (int i = 0; i < prediction.model_results.Length; i++)
                {
                    var r = prediction.model_results[i]; float y = 255 + i * 112;
                    Box(new Rect(763, y, 617, 101), new Color(.09f, .14f, .21f));
                    GUI.Label(new Rect(780, y + 10, 330, 26), r.name + "  ·  " + r.role.ToUpper(), label);
                    GUI.Label(new Rect(1110, y + 7, 250, 53), r.status == "ok" ? r.value.ToString("F4") : "FAILED", large);
                    GUI.Label(new Rect(780, y + 48, 560, 43), r.status == "ok" ? "anchor 대비 " + r.delta.ToString("+0.0000;-0.0000;0.0000") +
                        (r.interval != null && r.interval.nominal_coverage > 0 ? "  |  구간 " + r.interval.lower.ToString("F2") + " – " + r.interval.upper.ToString("F2") : "  |  dataset scale") : "이 모델의 결과를 계산하지 못했습니다.", muted);
                }
                saveName = GUI.TextField(new Rect(763, 622, 392, 38), saveName, field);
                if (Button(new Rect(1167, 622, 211, 38), "실험 저장")) StartCoroutine(Save(prediction.prediction_id));
                GUI.Label(new Rect(765, 679, 610, 44), "구간은 고정된 보정 결과입니다. 입력 변경 후 오차 범위를 보장하지 않습니다.", small);
            }
        }

        void DrawWafer()
        {
            Box(new Rect(252, 145, 564, 600), Panel); Box(new Rect(834, 145, 576, 600), Panel);
            string[] names = { "WM-811K · 단일", "MixedWM38 · 복합" };
            for (int i = 0; i < 2; i++) if (Button(new Rect(279 + i * 258, 165, 245, 40), (datasetIndex == i ? "✓ " : "") + names[i])) { datasetIndex = i; waferPrediction = null; }
            string[] patterns = { "정상", "중심", "가장자리", "스크래치", "중심+가장자리" };
            for (int i = 0; i < 5; i++) if (Button(new Rect(277 + i * 103, 219, 98, 37), patterns[i])) { patternIndex = i; GenerateMap(); }
            Rect map = new Rect(331, 275, 402, 402); GUI.DrawTexture(map, waferTexture, ScaleMode.StretchToFill);
            Event e = Event.current;
            if (map.Contains(e.mousePosition) && (e.type == EventType.MouseDown || e.type == EventType.MouseDrag))
            {
                int x = Mathf.Clamp((int)((e.mousePosition.x - map.x) / map.width * 52), 0, 51), y = Mathf.Clamp((int)((e.mousePosition.y - map.y) / map.height * 52), 0, 51);
                pixels[y * 52 + x] = brush; RefreshTexture(); waferPrediction = null; e.Use();
            }
            if (Button(new Rect(279, 690, 160, 37), brush == 2 ? "브러시: 불량" : "브러시: 정상")) brush = brush == 2 ? 1 : 2;
            if (Button(new Rect(456, 690, 332, 37), "웨이퍼 패턴 분류")) StartCoroutine(Classify());
            GUI.Label(new Rect(861, 169, 500, 34), "분류 결과", heading);
            GUI.Label(new Rect(861, 217, 515, 62), "예제 맵은 화면 조작용 합성 패턴입니다.\n실제 평가 점수는 저장소 보고서에서 확인하세요.", muted);
            if (waferPrediction != null)
            {
                GUI.Label(new Rect(861, 289, 516, 60), waferPrediction.labels.Length == 0 ? "선택된 결함 없음" : string.Join(" + ", waferPrediction.labels), heading);
                var scores = waferPrediction.scores.OrderByDescending(x => x.score).ToArray();
                for (int i = 0; i < scores.Length; i++)
                {
                    float y = 364 + i * 31;
                    GUI.Label(new Rect(862, y, 148, 28), scores[i].label, muted);
                    Box(new Rect(1016, y + 8, 268, 11), new Color(.14f, .21f, .29f));
                    Box(new Rect(1016, y + 8, (float)scores[i].score * 268, 11), scores[i].selected ? Teal : new Color(.31f, .42f, .54f));
                    GUI.Label(new Rect(1300, y, 86, 28), scores[i].score.ToString("F3"), muted);
                }
                if (Button(new Rect(862, 684, 515, 40), "분류 결과 저장")) StartCoroutine(Save(waferPrediction.prediction_id));
            }
        }

        void DrawHistory()
        {
            Box(new Rect(252, 145, 1158, 600), Panel);
            if (Button(new Rect(1200, 166, 174, 39), "목록 새로 고침")) StartCoroutine(LoadExperiments());
            GUI.Label(new Rect(278, 169, 860, 37), "실험명 / Stage / 저장 시간", heading);
            scroll = GUI.BeginScrollView(new Rect(277, 225, 1100, 480), scroll, new Rect(0, 0, 1060, Mathf.Max(460, experiments.Length * 70)));
            for (int i = 0; i < experiments.Length; i++)
            {
                var ex = experiments[i];
                GUI.Label(new Rect(0, i * 70, 620, 32), ex.name + "  ·  " + ex.stage, label);
                GUI.Label(new Rect(0, i * 70 + 30, 970, 26), ex.created_at + "  /  " + ex.id, small);
                if (Button(new Rect(840, i * 70 + 6, 185, 40), "JSON 내보내기")) Application.OpenURL(api.BaseUrl + "/api/v1/experiments/" + ex.id + "/export");
            }
            if (experiments.Length == 0) GUI.Label(new Rect(0, 22, 900, 80), "저장된 실험이 없습니다. 예측 후 ‘실험 저장’을 누르세요.", muted);
            GUI.EndScrollView();
        }

        IEnumerator Smoke()
        {
            SmokeResult result = new SmokeResult { health = ready, unity_version = Application.unityVersion };
            yield return Predict(); result.stageA = prediction != null && prediction.stage == "A";
            dirty = false; SetStage("B"); yield return Predict(); result.stageB = prediction != null && prediction.stage == "B";
            datasetIndex = 0; yield return Classify(); result.wm811k = waferPrediction != null && waferPrediction.dataset == "wm811k";
            datasetIndex = 1; yield return Classify(); result.mixedwm38 = waferPrediction != null && waferPrediction.dataset == "mixedwm38";
            saveName = "Unity smoke " + Guid.NewGuid().ToString("N").Substring(0, 8);
            if (prediction != null) { yield return Save(prediction.prediction_id); result.save = string.IsNullOrEmpty(error); }
            yield return LoadExperiments(); result.list = experiments.Length > 0;
            result.passed = result.health && result.stageA && result.stageB && result.wm811k && result.mixedwm38 && result.save && result.list;
            result.error = error;
            string output = Path.GetFullPath(Path.Combine(Application.dataPath, "../../../../.cache/unity-smoke"));
            var args = Environment.GetCommandLineArgs(); int pos = Array.IndexOf(args, "-cmp-output");
            if (pos >= 0 && pos + 1 < args.Length) output = args[pos + 1];
            Directory.CreateDirectory(output);
            File.WriteAllText(Path.Combine(output, "smoke.json"), JsonUtility.ToJson(result, true));
            dirty = false; SetStage("A"); interval = true; yield return Predict();
            page = 0; yield return new WaitForSeconds(1);
            yield return Capture(Path.Combine(output, "cmp-demo.png"));
            yield return new WaitForSeconds(2);
            page = 1; yield return new WaitForSeconds(1);
            yield return Capture(Path.Combine(output, "wafer-demo.png"));
            yield return new WaitForSeconds(2);
            Debug.Log("CMP_SMOKE " + JsonUtility.ToJson(result));
            Application.Quit(result.passed ? 0 : 1);
        }

        IEnumerator Capture(string path)
        {
            yield return new WaitForEndOfFrame();
            var shot = ScreenCapture.CaptureScreenshotAsTexture();
            if (shot != null) { File.WriteAllBytes(path, shot.EncodeToPNG()); Destroy(shot); }
        }

        void OnDestroy() { if (waferTexture != null) Destroy(waferTexture); if (font != null) Destroy(font); }
    }
}
