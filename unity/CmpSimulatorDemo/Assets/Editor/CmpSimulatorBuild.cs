using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class CmpSimulatorBuild {
    public static void Build() {
        Directory.CreateDirectory("Assets/Scenes");
        var scene=EditorSceneManager.NewScene(NewSceneSetup.EmptyScene,NewSceneMode.Single);
        var camera=new GameObject("Main Camera").AddComponent<Camera>();
        camera.clearFlags=CameraClearFlags.SolidColor; camera.backgroundColor=new Color(.04f,.06f,.1f);
        new GameObject("CMP Simulator").AddComponent<CmpSimulatorDemo>();
        EditorSceneManager.SaveScene(scene,"Assets/Scenes/CmpSimulator.unity");
        EditorBuildSettings.scenes=new[]{new EditorBuildSettingsScene("Assets/Scenes/CmpSimulator.unity",true)};
        PlayerSettings.companyName="CMP Education"; PlayerSettings.productName="CMP History Simulator";
        PlayerSettings.defaultScreenWidth=1280; PlayerSettings.defaultScreenHeight=850;
        PlayerSettings.fullScreenMode=FullScreenMode.Windowed; PlayerSettings.resizableWindow=true; PlayerSettings.runInBackground=true;
        PlayerSettings.insecureHttpOption=InsecureHttpOption.AlwaysAllowed;
        PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Standalone,ScriptingImplementation.Mono2x);
        AssetDatabase.SaveAssets();
        string output=Path.GetFullPath("../../builds/CmpSimulatorDemo/CmpSimulatorDemo.exe");
        Directory.CreateDirectory(Path.GetDirectoryName(output));
        var report=BuildPipeline.BuildPlayer(new BuildPlayerOptions { scenes=new[]{"Assets/Scenes/CmpSimulator.unity"},locationPathName=output,
            target=BuildTarget.StandaloneWindows64,options=BuildOptions.None });
        string record=Path.GetFullPath("../../verification/simulator-integration-v1/unity-build.json");
        Directory.CreateDirectory(Path.GetDirectoryName(record));
        File.WriteAllText(record,JsonUtility.ToJson(new BuildRecord { status=report.summary.result.ToString(), errors=(int)report.summary.totalErrors,
            bytes=(long)report.summary.totalSize, unity_version=Application.unityVersion },true));
        if(report.summary.result!=BuildResult.Succeeded) throw new Exception("CMP build failed");
        Debug.Log("CMP_SIMULATOR_BUILD_SUCCEEDED");
    }
    [Serializable] class BuildRecord { public string status,unity_version; public int errors; public long bytes; }
}
