using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace CmpLab
{
    public class CmpApiClient : MonoBehaviour
    {
        public string BaseUrl = "http://127.0.0.1:8765";

        public IEnumerator Send<T>(string path, string method, object body,
            Action<ApiEnvelope<T>> completed, string idempotencyKey = null)
        {
            if (!Uri.TryCreate(BaseUrl, UriKind.Absolute, out var uri) || !uri.IsLoopback)
            {
                completed(new ApiEnvelope<T> { status = "error", error = new ApiError { code = "LOCAL_ONLY", message = "로컬 API 주소를 사용하세요." } });
                yield break;
            }
            using (var request = new UnityWebRequest(BaseUrl.TrimEnd('/') + path, method))
            {
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = 30;
                if (body != null)
                {
                    request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(JsonUtility.ToJson(body)));
                    request.SetRequestHeader("Content-Type", "application/json");
                }
                if (!string.IsNullOrEmpty(idempotencyKey)) request.SetRequestHeader("Idempotency-Key", idempotencyKey);
                yield return request.SendWebRequest();
                ApiEnvelope<T> response;
                try
                {
                    response = JsonUtility.FromJson<ApiEnvelope<T>>(request.downloadHandler.text);
                    if (response == null || string.IsNullOrEmpty(response.status)) throw new FormatException();
                    // JsonUtility may instantiate reference fields encoded as null.
                    if (response.status == "error") response.data = default(T);
                    else response.error = null;
                }
                catch
                {
                    response = new ApiEnvelope<T> { status = "error", error = new ApiError
                    { code = "CONNECTION_FAILED", message = "API에 연결할 수 없습니다. 서버 실행 상태를 확인하세요.", retryable = true } };
                }
                completed(response);
            }
        }
    }

    [Serializable] public class ApiEnvelope<T> { public string request_id, api_version, status; public T data; public ApiError error; }
    [Serializable] public class ApiError { public string code, message; public bool retryable; }
    [Serializable] public class Items<T> { public T[] items; public string next_cursor; public bool has_more; }
    [Serializable] public class Health { public bool ready, mrr, wafer_classification; public string release_status; }
    [Serializable] public class OverrideValue { public string variable_id; public double value; }
    [Serializable] public class Variable { public string stage, variable_id, label, unit; public double normal_min, normal_max, observed_hard_min, observed_hard_max; }
    [Serializable] public class Scenario { public string stage, scenario_id, label, chamber_route; public OverrideValue[] defaults; }
    [Serializable] public class PredictRequest
    {
        public string input_schema_version = "1.0.0", stage, scenario_id;
        public OverrideValue[] overrides;
        public bool include_interval;
    }
    [Serializable] public class Ood { public string level; public double score, q95, q99; }
    [Serializable] public class Interval { public double lower, upper, nominal_coverage; public string status, notice; }
    [Serializable] public class ModelResult
    {
        public string name, model_type, role, model_version, artifact_hash, status;
        public double value, anchor_value, delta;
        public Interval interval;
        public ApiError error;
    }
    [Serializable] public class Prediction
    {
        public string prediction_id, stage, scenario_id, notice, release_mode, model_bundle_version;
        public Ood ood;
        public ModelResult[] model_results;
    }
    [Serializable] public class WaferRequest { public string dataset; public int width, height; public int[] pixels; }
    [Serializable] public class LabelScore { public string label; public double score; public bool selected; }
    [Serializable] public class WaferPrediction { public string prediction_id, dataset, model_version, notice; public string[] labels; public LabelScore[] scores; }
    [Serializable] public class SaveRequest { public string name, prediction_id, notes = ""; public bool force; }
    [Serializable] public class Experiment { public string id, name, stage, created_at; public Prediction prediction; }
    [Serializable] public class SmokeResult
    {
        public bool passed, health, stageA, stageB, wm811k, mixedwm38, save, list;
        public string api_version = "1.0", unity_version, error;
    }
}
