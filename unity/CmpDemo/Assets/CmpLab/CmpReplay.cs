using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using UnityEngine;

namespace CmpLab
{
    [Serializable] public class ReplayConfig
    {
        public string scenario_id = "fold_2", mode = "separate";
        public int period = 1, delay;
        public double alpha = .4;
    }
    [Serializable] public class ReplayStep { public int expected_revision, count = 1; }
    [Serializable] public class ReplayReset { public int expected_revision; }
    [Serializable] public class ReplayMetrics { public int n; public double mae, rmse; }
    [Serializable] public class ReplayRow
    {
        public string sample_id, stage, recipe;
        public double prediction, truth, error, time_ratio, u_pad, u_dresser, gap_s, p_main, state_age_seconds;
        public bool measured, measurement_selected;
        public int observed_count;
    }
    [Serializable] public class ReplayState
    {
        public string session_id, model_version, scenario_label, notice;
        public int revision, cursor, total, initial_measurements, measurements_requested, measurements_released;
        public bool finished;
        public ReplayConfig config;
        public ReplayMetrics observed_metrics, retrospective_metrics;
        public ReplayRow[] rows;
    }
    [Serializable] public class ReplaySmokeResult
    {
        public bool passed, create, step, reset, complete, shared, legacy;
        public int total, measured;
        public double separate_mae, shared_mae;
        public string error, unity_version;
    }

    public partial class CmpDemo
    {
        ReplayConfig replayConfig = new ReplayConfig();
        ReplayState replay;
        bool replayAuto;
        int replayAutoGeneration;
        readonly List<string> replayComparisons = new List<string>();

        string ReplayPath => "/api/v2/state-sessions/" + replay.session_id;
        string ModeName(string mode) => mode == "shared" ? "A·B 공유" : "레시피별";
        string ReplayName(ReplayState r) => r.scenario_label + " / " + r.config.period + "장 / 지연 " + r.config.delay + " / " + ModeName(r.config.mode) + " / λ " + r.config.alpha.ToString("F2");

        IEnumerator NewReplay()
        {
            StopReplay(); busy = true; error = "";
            if (replay != null)
            {
                if (replay.finished && replay.retrospective_metrics != null)
                {
                    replayComparisons.Insert(0, ReplayName(replay) + "  MAE " + replay.retrospective_metrics.mae.ToString("F3"));
                    if (replayComparisons.Count > 2) replayComparisons.RemoveAt(2);
                }
                yield return api.Send<object>(ReplayPath, "DELETE", null, r => { });
            }
            replay = null;
            yield return api.Send<ReplayState>("/api/v2/state-sessions", "POST", replayConfig, r => { replay = r.data; Check(r.error); });
            if (replay != null) status = "실험 준비 완료 · 측정되지 않은 정답은 추적에 사용하지 않습니다.";
            busy = false;
        }

        IEnumerator AdvanceReplay(int count)
        {
            if (replay == null || replay.finished) yield break;
            busy = true; error = ""; bool conflict = false;
            yield return api.Send<ReplayState>(ReplayPath + "/advance", "POST", new ReplayStep { expected_revision = replay.revision, count = count }, r =>
            {
                if (r.data != null) replay = r.data;
                conflict = r.error != null && r.error.code == "STATE_CONFLICT"; Check(r.error);
            });
            if (conflict) yield return api.Send<ReplayState>(ReplayPath, "GET", null, r => { if (r.data != null) replay = r.data; });
            if (string.IsNullOrEmpty(error)) status = replay.finished ? "재생 완료 · 전체 과거 기록의 사후 MAE를 확인하세요." : "공정 " + replay.cursor + " / " + replay.total + " · 공개된 측정으로만 상태 갱신";
            busy = false;
        }

        IEnumerator ResetReplay()
        {
            StopReplay(); if (replay == null) yield break;
            busy = true; error = "";
            yield return api.Send<ReplayState>(ReplayPath + "/reset", "POST", new ReplayReset { expected_revision = replay.revision }, r => { if (r.data != null) replay = r.data; Check(r.error); });
            busy = false; status = "같은 초기 상태로 돌아왔습니다.";
        }

        IEnumerator AutoReplay()
        {
            int generation = ++replayAutoGeneration;
            replayAuto = true;
            while (replayAuto && generation == replayAutoGeneration && page == 3 && replay != null && !replay.finished)
            {
                yield return AdvanceReplay(1);
                if (!string.IsNullOrEmpty(error)) break;
                yield return new WaitForSeconds(.25f);
            }
            if (generation == replayAutoGeneration) replayAuto = false;
        }

        void StopReplay() { replayAuto = false; replayAutoGeneration++; }

        void DrawReplay()
        {
            Box(new Rect(252, 145, 324, 600), Panel); Box(new Rect(594, 145, 816, 600), Panel);
            GUI.Label(new Rect(273, 163, 286, 32), "실험 설정", heading);
            string[] names = { "초기 상태", "중기 변화", "후기 상태", "후기 압력 변화" };
            for (int i = 0; i < 4; i++)
            {
                string id = "fold_" + (i + 2);
                if (Button(new Rect(273 + i % 2 * 145, 207 + i / 2 * 43, 137, 37), (replayConfig.scenario_id == id ? "✓ " : "") + names[i])) replayConfig.scenario_id = id;
            }
            GUI.Label(new Rect(273, 299, 280, 28), "측정 주기 · 기록된 공정 기준", muted);
            int[] periods = { 1, 5, 10 };
            for (int i = 0; i < 3; i++) if (Button(new Rect(273 + i * 96, 332, 89, 38), (replayConfig.period == periods[i] ? "✓ " : "") + periods[i] + "장")) replayConfig.period = periods[i];
            GUI.Label(new Rect(273, 383, 285, 27), "결과 공개 지연 · 주기와 별개", muted);
            if (Button(new Rect(273, 416, 137, 38), (replayConfig.delay == 0 ? "✓ " : "") + "완료 즉시")) replayConfig.delay = 0;
            if (Button(new Rect(418, 416, 137, 38), (replayConfig.delay == 5 ? "✓ " : "") + "5개 완료 뒤")) replayConfig.delay = 5;
            GUI.Label(new Rect(273, 467, 280, 27), "상태 추적 방식", muted);
            if (Button(new Rect(273, 500, 137, 38), (replayConfig.mode == "separate" ? "✓ " : "") + "레시피별")) replayConfig.mode = "separate";
            if (Button(new Rect(418, 500, 137, 38), (replayConfig.mode == "shared" ? "✓ " : "") + "A·B 공유")) replayConfig.mode = "shared";
            GUI.Label(new Rect(273, 553, 281, 27), "최근 측정 가중치 λ  " + replayConfig.alpha.ToString("F2"), muted);
            replayConfig.alpha = Math.Round(GUI.HorizontalSlider(new Rect(278, 590, 270, 20), (float)replayConfig.alpha, .1f, .8f), 2);
            if (Button(new Rect(273, 628, 280, 44), "선택한 조건으로 새 실험")) StartCoroutine(NewReplay());
            GUI.Label(new Rect(273, 683, 282, 49), "설정 변경은 새 실험부터 적용됩니다.\n서버를 종료하면 세션이 사라집니다.", small);

            GUI.Label(new Rect(616, 166, 773, 33), replay == null ? "실제 장비 기록으로 시작하세요" : ReplayName(replay), heading);
            if (replay == null)
            {
                GUI.Label(new Rect(632, 250, 744, 190), "1. 장비 기록 시기와 측정 주기를 선택하세요.\n\n2. 다음 공정을 예측하고 공개된 측정으로 상태를 갱신합니다.\n\n3. 같은 기록에서 별도·공유 추적의 오차와 측정 횟수를 비교하세요.", label);
                GUI.Label(new Rect(632, 510, 730, 95), "공유 추적은 항상 더 정확하지 않습니다.\n압력·소모품의 가상 변경 효과를 만들어내지 않고 기록된 장비 상태를 재생합니다.", muted);
                return;
            }
            ReplayRow last = replay.rows != null && replay.rows.Length > 0 ? replay.rows[replay.rows.Length - 1] : null;
            string[] labels = { "예측 MRR · 상대 척도", "공개 / 요청한 측정", "기준 대비 시간 비율" };
            string[] values = { last == null ? "—" : last.prediction.ToString("F2"), replay.measurements_released + " / " + replay.measurements_requested,
                last == null ? "—" : last.time_ratio.ToString("F3") + " 배" };
            for (int i = 0; i < 3; i++)
            {
                float x = 616 + i * 256; Box(new Rect(x, 217, 244, 88), new Color(.09f, .14f, .21f));
                GUI.Label(new Rect(x + 12, 226, 222, 25), labels[i], small);
                GUI.Label(new Rect(x + 12, 254, 222, 45), values[i], heading);
            }
            string observed = replay.observed_metrics != null && replay.observed_metrics.n > 0 ? replay.observed_metrics.mae.ToString("F3") : "측정 대기";
            string full = replay.finished && replay.retrospective_metrics != null ? replay.retrospective_metrics.mae.ToString("F3") : "완료 후 표시";
            GUI.Label(new Rect(619, 319, 775, 31), "공개 측정 MAE  " + observed + "     전체 기록 사후 MAE  " + full + "     진행 " + replay.cursor + "/" + replay.total, label);
            GUI.Label(new Rect(619, 359, 775, 51), last == null ? "초기 측정 " + replay.initial_measurements + "개로 상태를 준비했습니다." :
                last.recipe + "  패드 " + last.u_pad.ToString("F1") + " / 드레서 " + last.u_dresser.ToString("F1") +
                "  압력 " + last.p_main.ToString("F1") + "  관측 간격 " + last.gap_s.ToString("F0") + "초\n상태 나이 " + last.state_age_seconds.ToString("F0") + "초 · 시간 비율은 같은 목표 제거량의 상대값입니다.", muted);
            bool enabled = GUI.enabled;
            GUI.enabled = enabled && !replay.finished;
            if (Button(new Rect(617, 423, 112, 37), "다음 1개")) { StopReplay(); StartCoroutine(AdvanceReplay(1)); }
            if (Button(new Rect(737, 423, 119, 37), "다음 10개")) { StopReplay(); StartCoroutine(AdvanceReplay(10)); }
            if (Button(new Rect(864, 423, 151, 37), replayAuto ? "재생 정지" : "자동 재생")) { if (replayAuto) StopReplay(); else StartCoroutine(AutoReplay()); }
            GUI.enabled = enabled;
            if (Button(new Rect(1023, 423, 117, 37), "초기화")) StartCoroutine(ResetReplay());
            if (Button(new Rect(1148, 423, 235, 37), "현재 결과 JSON 내보내기")) Application.OpenURL(api.BaseUrl + ReplayPath + "/export");
            DrawReplayChart(new Rect(632, 506, 737, 133));
            GUI.Label(new Rect(620, 469, 765, 30), "최근 48개  ·  청록선: 예측  /  주황점: 공개된 측정", small);
            GUI.Label(new Rect(620, 648, 766, 38), "공개 측정 오차는 측정된 표본만의 점수입니다. 전체 사후 오차와 구분해 비교하세요.", small);
            for (int i = 0; i < replayComparisons.Count; i++) GUI.Label(new Rect(620, 686 + i * 23, 766, 24), "지난 완료  " + replayComparisons[i], small);
        }

        void DrawReplayChart(Rect rect)
        {
            Box(rect, new Color(.035f, .055f, .10f));
            if (replay.rows == null || replay.rows.Length < 1) return;
            var rows = replay.rows.Skip(Math.Max(0, replay.rows.Length - 48)).ToArray();
            double low = rows.Min(r => r.measured ? Math.Min(r.prediction, r.truth) : r.prediction);
            double high = rows.Max(r => r.measured ? Math.Max(r.prediction, r.truth) : r.prediction);
            double pad = Math.Max(1.0, (high - low) * .12); low -= pad; high += pad;
            Vector2 prev = Vector2.zero;
            for (int i = 0; i < rows.Length; i++)
            {
                float x = rect.x + 8 + i * (rect.width - 16) / Math.Max(1, rows.Length - 1);
                float y = rect.yMax - 8 - (float)((rows[i].prediction - low) / (high - low)) * (rect.height - 16);
                Vector2 next = new Vector2(x, y);
                if (i > 0) ChartLine(prev, next, Teal); prev = next;
                if (rows[i].measured)
                {
                    float actual = rect.yMax - 8 - (float)((rows[i].truth - low) / (high - low)) * (rect.height - 16);
                    Box(new Rect(x - 3, actual - 3, 6, 6), Amber);
                }
            }
        }
        void ChartLine(Vector2 from, Vector2 to, Color color)
        {
            Matrix4x4 old = GUI.matrix;
            GUIUtility.RotateAroundPivot(Mathf.Atan2(to.y - from.y, to.x - from.x) * Mathf.Rad2Deg, from);
            Box(new Rect(from.x, from.y, Vector2.Distance(from, to), 2), color); GUI.matrix = old;
        }

        IEnumerator ReplaySmoke()
        {
            page = 3;
            ReplaySmokeResult result = new ReplaySmokeResult { unity_version = Application.unityVersion };
            replayConfig = new ReplayConfig { period = 5, mode = "separate" };
            yield return NewReplay(); result.create = replay != null;
            if (replay != null)
            {
                yield return AdvanceReplay(80); result.step = replay.cursor == 80;
                var args = Environment.GetCommandLineArgs(); int index = Array.IndexOf(args, "-cmp-output");
                string output = index >= 0 && index + 1 < args.Length ? args[index + 1] : Path.GetFullPath("replay-smoke");
                Directory.CreateDirectory(output);
                yield return new WaitForSeconds(.5f); yield return Capture(Path.Combine(output, "measurement-progress.png"));
                yield return ResetReplay(); result.reset = replay.cursor == 0;
                while (!replay.finished && string.IsNullOrEmpty(error)) yield return AdvanceReplay(100);
                result.complete = replay.finished;
                result.separate_mae = replay.retrospective_metrics.mae; result.total = replay.total; result.measured = replay.measurements_released;
                replayConfig.mode = "shared"; yield return NewReplay();
                while (replay != null && !replay.finished && string.IsNullOrEmpty(error)) yield return AdvanceReplay(100);
                result.shared = replay != null && replay.finished;
                if (result.shared) result.shared_mae = replay.retrospective_metrics.mae;
                yield return new WaitForSeconds(.5f); yield return Capture(Path.Combine(output, "measurement-complete.png"));
                // Existing Stage A path remains callable in the same built executable.
                dirty = false; SetStage("A"); yield return Predict(); result.legacy = prediction != null;
                result.error = error;
                result.passed = result.create && result.step && result.reset && result.complete && result.shared && result.legacy && string.IsNullOrEmpty(error);
                File.WriteAllText(Path.Combine(output, "unity-replay-smoke.json"), JsonUtility.ToJson(result, true));
            }
            Debug.Log("CMP_REPLAY_SMOKE " + JsonUtility.ToJson(result));
            Application.Quit(result.passed ? 0 : 1);
        }
    }
}
