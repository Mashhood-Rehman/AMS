import React, { useEffect, useRef, useState } from "react";

const GoogleTranslator = ({ mountKey = "" }) => {
  const containerRef = useRef(null);
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const authKey = user?._id || "guest";
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let attempts = 0;
    let retryTimer = null;
    setIsLoading(true);

    const hasWidget = () => {
      const root = containerRef.current;
      return !!root?.querySelector(".goog-te-combo");
    };

    const hardResetTranslateRuntime = () => {
      const scripts = document.querySelectorAll(
        'script[src*="translate.google.com/translate_a/element.js"]',
      );
      scripts.forEach((s) => s.remove());

      try {
        delete window.google;
      } catch (_) {
        window.google = undefined;
      }
    };

    const initTranslate = () => {
      const root = containerRef.current;
      if (!root) return;
      if (hasWidget()) return;

      if (window.google?.translate?.TranslateElement) {
        root.innerHTML = "";
        try {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              autoDisplay: false,
              layout:
                window.google.translate.TranslateElement.InlineLayout.HORIZONTAL,
            },
            "google_translate_element",
          );
          window.setTimeout(() => {
            if (hasWidget()) setIsLoading(false);
          }, 100);
        } catch (_) {}
      }
    };

    const ensureScript = () => {
      if (window.google?.translate) {
        initTranslate();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="translate.google.com/translate_a/element.js"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
      }
    };

    window.googleTranslateElementInit = initTranslate;
    ensureScript();
    initTranslate();

    retryTimer = window.setInterval(() => {
      attempts += 1;
      if (hasWidget() || attempts > 12) {
        if (hasWidget()) setIsLoading(false);
        if (!hasWidget() && attempts > 12) {
          hardResetTranslateRuntime();
          ensureScript();
          initTranslate();
          window.setTimeout(() => {
            if (hasWidget()) setIsLoading(false);
          }, 300);
        }
        window.clearInterval(retryTimer);
        return;
      }
      initTranslate();
    }, 500);

    return () => {
      if (retryTimer) window.clearInterval(retryTimer);
    };
  }, [authKey, mountKey]);

  return (
    <div className="translate-container relative w-[180px] min-h-[32px]">
      {isLoading && (
        <span className="absolute inset-0 flex text-sm pl-2 pt-1.5 text-black bg-white rounded-md pointer-events-none">
          Loading translation...
        </span>
      )}
      <div
        id="google_translate_element"
        ref={containerRef}
        className={`min-h-[32px] w-[180px] ${isLoading ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
};

export default GoogleTranslator;
