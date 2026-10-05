

  // ../artifact/lib/artifact/ui/stage-mount.mjs
  var ARTIFACT_STAGE_MOUNT_EVENT = "planr:artifact-stage-mount";
  function whenArtifactStage(window2) {
    const mounted = window2.__openPlanrArtifactStage;
    if (mounted) return Promise.resolve(mounted);
    return new Promise((resolve) => {
      window2.addEventListener(ARTIFACT_STAGE_MOUNT_EVENT, (event) => resolve(event.detail), {
        once: true
      });
    });
  }