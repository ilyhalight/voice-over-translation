import "requestidlecallback-polyfill";
import { sitesPoketube } from "@vot.js/shared/alternativeUrls";
import { EventImpl } from "../core/eventImpl.ts";
import debug from "./debug.ts";

export class VideoObserver {
  static adKeywords = new Set([
    "advertise",
    "advertisement",
    "promo",
    "sponsor",
    "banner",
    "commercial",
    "preroll",
    "midroll",
    "postroll",
    "ad-container",
    "sponsored",
  ]);

  constructor() {
    this.videoCache = new WeakSet();
    this.observedNodes = {
      added: new Set(),
      removed: new Set(),
    };
    this.onVideoAdded = new EventImpl();
    this.onVideoRemoved = new EventImpl();
    this.observer = new MutationObserver(this.handleMutations);
  }

  isAdRelated(element) {
    const attributes = ["class", "id", "title"];
    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && VideoObserver.adKeywords.has(value.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  hasAudio(video) {
    if (sitesPoketube.includes(window.location.hostname)) {
      // mozHasAudio in poketube is always false
      return !video.muted;
    }

    if (typeof video.mozHasAudio !== "undefined") {
      return video.mozHasAudio;
    }
    if (typeof video.webkitAudioDecodedByteCount !== "undefined") {
      return video.webkitAudioDecodedByteCount > 0;
    }
    if ("audioTracks" in video) {
      return video.audioTracks.length > 0 || !video.muted;
    }
    return !video.muted;
  }

  isValidVideo(video) {
    if (this.isAdRelated(video)) return false;

    let parent = video.parentElement;
    while (parent && !this.isAdRelated(parent)) {
      parent = parent.parentElement;
    }
    if (parent) return false;

    if (!this.hasAudio(video)) {
      debug.log("Ignoring video without audio:", video);
      return false;
    }

    return true;
  }

  traverseDOM(root) {
    if (root instanceof HTMLVideoElement) {
      this.checkVideoState(root);
      return;
    }

    const treeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) =>
          node.tagName === "VIDEO" || node.shadowRoot
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      },
    );

    while (treeWalker.nextNode()) {
      const currentNode = treeWalker.currentNode;
      if (currentNode instanceof HTMLVideoElement) {
        this.checkVideoState(currentNode);
      }
      if (currentNode.shadowRoot) {
        this.traverseDOM(currentNode.shadowRoot);
      }
    }
  }

  checkVideoState(video) {
    if (this.videoCache.has(video)) return;

    this.videoCache.add(video);

    const onLoadedData = () => {
      if (this.isValidVideo(video)) {
        this.onVideoAdded.dispatch(video);
      }
      video.removeEventListener("loadeddata", onLoadedData);
    };

    const onEmptied = () => {
      if (!video.isConnected) {
        this.onVideoRemoved.dispatch(video);
        this.videoCache.delete(video);
        video.removeEventListener("emptied", onEmptied);
      }
    };

    video.addEventListener("emptied", onEmptied);

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onLoadedData();
    } else {
      video.addEventListener("loadeddata", onLoadedData);
    }
  }

  handleMutations = (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;

      for (const node of mutation.addedNodes) {
        this.observedNodes.added.add(node);
      }
      for (const node of mutation.removedNodes) {
        this.observedNodes.removed.add(node);
      }
    }

    window.requestIdleCallback(
      () => {
        for (const node of this.observedNodes.added) {
          this.traverseDOM(node);
        }

        for (const node of this.observedNodes.removed) {
          if (node.querySelectorAll) {
            const videos = node.querySelectorAll("video");
            for (const video of videos) {
              if (!video.isConnected) {
                this.onVideoRemoved.dispatch(video);
                this.videoCache.delete(video);
              }
            }
          }
        }

        this.observedNodes.added.clear();
        this.observedNodes.removed.clear();
      },
      { timeout: 1000 },
    );
  };

  enable() {
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    this.traverseDOM(document.documentElement);
  }

  disable() {
    this.observer.disconnect();
    this.videoCache = new WeakSet();
  }
}
