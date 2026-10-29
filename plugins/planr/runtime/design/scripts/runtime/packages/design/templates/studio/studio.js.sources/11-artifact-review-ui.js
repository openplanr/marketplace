

  // ../artifact/lib/artifact/ui/stage-mount.mjs
  var ARTIFACT_STAGE_MOUNT_EVENT = "planr:artifact-stage-mount";
  function whenArtifactStage(window2) {
    let mounted = window2.__openPlanrArtifactStage;
    return mounted ? Promise.resolve(mounted) : new Promise((resolve) => {
      window2.addEventListener(ARTIFACT_STAGE_MOUNT_EVENT, (event) => resolve(event.detail), {
        once: !0
      });
    });
  }