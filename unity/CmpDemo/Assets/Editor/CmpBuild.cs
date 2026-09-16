using System;
using System.IO;
using CmpLab;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class CmpBuild
{
    public static void Build()
    {
        Directory.CreateDirectory("Assets/Scenes");
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var camera = new GameObject("Main Camera").AddComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(.035f, .055f, .10f);
        new GameObject("CMP Virtual Lab").AddComponent<CmpDemo>();
        EditorSceneManager.SaveScene(scene, "Assets/Scenes/CmpDemo.unity");
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene("Assets/Scenes/CmpDemo.unity", true) };
        PlayerSettings.companyName = "CMP Virtual Lab";
        PlayerSettings.productName = "CMP Virtual Lab";
        PlayerSettings.defaultScreenWidth = 1440;
        PlayerSettings.defaultScreenHeight = 900;
        PlayerSettings.fullScreenMode = FullScreenMode.Windowed;
        PlayerSettings.resizableWindow = true;
        PlayerSettings.runInBackground = true;
        PlayerSettings.insecureHttpOption = InsecureHttpOption.AlwaysAllowed;
        PlayerSettings.SetScriptingBackend(UnityEditor.Build.NamedBuildTarget.Standalone, ScriptingImplementation.Mono2x);
        AssetDatabase.SaveAssets();
        string output = Path.GetFullPath("../../builds/CmpDemo/CmpDemo.exe");
        Directory.CreateDirectory(Path.GetDirectoryName(output));
        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes = new[] { "Assets/Scenes/CmpDemo.unity" }, locationPathName = output,
            target = BuildTarget.StandaloneWindows64, options = BuildOptions.None
        });
        Debug.Log("CMP_BUILD " + report.summary.result + " bytes=" + report.summary.totalSize);
        if (report.summary.result != BuildResult.Succeeded) throw new Exception("CMP demo build failed");
    }
}
