(async () => {
  for (let i = 0; i < 50 && !window.fixture; i++)
    await new Promise((r) => setTimeout(r, 100));
  if (!window.fixture)
    throw new Error(window.fixtureError || "Fixture not ready");
  const f = window.fixture,
    results = [];
  const pause = () => new Promise((r) => setTimeout(r, 120));
  const near = (a, b) => Math.abs(a - b) < 0.001;
  const check = (name, pass, details) => results.push({ name, pass, details });
  const buttons = f.overlay.volumeQuickControls.buttons;
  check(
    "three compact toggles directly below subtitles",
    buttons.size === 3 &&
      f.overlay.subtitlesSelect.container.nextElementSibling ===
        f.overlay.volumeQuickControls.container &&
      [...buttons.values()].every(
        (b) =>
          Math.abs(
            b.getBoundingClientRect().top -
              buttons.get("enabledAutoVolume").getBoundingClientRect().top,
          ) < 1,
      ),
  );
  buttons.get("enabledAutoVolume").click();
  await pause();
  check(
    "quick reduction: 80% to 15%, full setting and persistence",
    near(f.video.volume, 0.15) &&
      f.settings.autoSetVolumeCheckbox.checked &&
      (await f.votStorage.get("enabledAutoVolume")) === true,
    { video: f.video.volume },
  );
  buttons.get("enabledAutoVolume").click();
  await pause();
  check(
    "turning reduction off restores 80%",
    near(f.video.volume, 0.8) && !f.settings.autoSetVolumeCheckbox.checked,
    { video: f.video.volume },
  );
  f.settings.autoVolumeModeSelect.events.selectItem.dispatch("hold");
  await pause();
  buttons.get("enabledAutoVolume").click();
  await pause();
  f.video.volume = 0.6;
  await pause();
  check("hold caps native original volume at 15%", near(f.video.volume, 0.15));
  f.video.volume = 0.05;
  await pause();
  check("hold permits lowering original below cap", near(f.video.volume, 0.05));
  buttons.get("syncVolume").click();
  await pause();
  check(
    "quick link enables fixed offset and persists",
    f.data.syncVolume &&
      f.data.volumeLinkMode === "offset" &&
      (await f.votStorage.get("volumeLinkMode")) === "offset",
  );
  f.video.volume = 0.6;
  await pause();
  check(
    "linked audio uses actual clamped original +10 points",
    near(f.video.volume, 0.15) && near(f.audio.volume, 0.25),
    { video: f.video.volume, audio: f.audio.volume },
  );
  f.overlay.videoVolumeSlider.events.input.dispatch(60, false);
  await pause();
  check(
    "VOT slider at existing ceiling links actual rather than attempted volume",
    near(f.video.volume, 0.15) &&
      near(f.audio.volume, 0.25) &&
      f.overlay.videoVolumeSlider.value === 15,
  );
  check(
    "extended boost blocked while linked",
    buttons.get("audioBooster").disabled &&
      f.settings.audioBoosterCheckbox.disabled,
  );
  f.video.muted = true;
  await pause();
  check("mute silences linked audio", near(f.audio.volume, 0));
  f.video.muted = false;
  await pause();
  check("unmute restores linked audio", near(f.audio.volume, 0.25));
  f.settings.autoSetVolumeSlider.value = 10;
  await pause();
  check(
    "new ceiling immediately updates original and linked audio",
    near(f.video.volume, 0.1) && near(f.audio.volume, 0.2),
    { video: f.video.volume, audio: f.audio.volume },
  );
  buttons.get("enabledAutoVolume").click();
  await pause();
  check(
    "restoration updates linked audio from 80% baseline",
    near(f.video.volume, 0.8) && near(f.audio.volume, 0.9),
  );
  buttons.get("syncVolume").click();
  await pause();
  buttons.get("audioBooster").click();
  await pause();
  check(
    "boost toggles full setting and increases slider range",
    f.data.audioBooster &&
      f.settings.audioBoosterCheckbox.checked &&
      f.overlay.translationVolumeSlider.max > 100,
  );
  buttons.get("audioBooster").click();
  await pause();
  f.settings.autoVolumeModeSelect.events.selectItem.dispatch("once");
  await pause();
  buttons.get("enabledAutoVolume").click();
  await pause();
  f.video.volume = 0.6;
  await pause();
  f.handler.setupAudioSettings();
  await pause();
  check(
    "once allows later manual volume despite setup refresh",
    near(f.video.volume, 0.6),
  );
  buttons.get("enabledAutoVolume").click();
  await pause();
  check("once also restores baseline on disable", near(f.video.volume, 0.8));
  buttons.get("enabledAutoVolume").click();
  await pause();
  const reducedBeforeStop = f.video.volume;
  // Native media elements stand in for Chaimu; supply its cleanup contract only.
  f.handler.stopTranslatePromise = null;
  f.handler.actionsGeneration = 0;
  f.handler.votClient = { provider: { fetchOpts: {} } };
  f.audio.removeVideoEvents = () => {};
  f.audio.clear = async () => f.audio.removeAttribute("src");
  await f.handler.stopTranslate();
  await pause();
  check(
    "real stopTranslate restores original volume and clears audio",
    near(f.video.volume, 0.8) && !f.handler.hasActiveSource(),
    { reduced: reducedBeforeStop, restored: f.video.volume },
  );
  check(
    "no uncaught browser errors",
    window.fixtureErrors.length === 0,
    window.fixtureErrors,
  );
  window.qaResults = results;
  return results;
})();
