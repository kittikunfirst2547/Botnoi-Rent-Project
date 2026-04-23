import { useEffect } from "react";

export const BotnoiChat = () => {
  useEffect(() => {
    // 1. Initialize BN on window load
    window.onload = function () {
      // @ts-expect-error: BN is added by the SDK script
      if (window.BN) window.BN.init({ version: "1.0" });
    };

    // 2. Load the Botnoi SDK Script
    const id = "bn-jssdk";
    if (!document.getElementById(id)) {
      const bjs = document.getElementsByTagName("script")[0];
      const js = document.createElement("script");
      js.id = id;
      js.src = "https://console.botnoi.ai/customerchat/index.js";
      if (bjs && bjs.parentNode) {
        bjs.parentNode.insertBefore(js, bjs);
      } else {
        document.head.appendChild(js);
      }
    }

    // Optional: If script already loaded, re-init
    // @ts-expect-error: BN is added by the SDK script
    if (window.BN && !window.BN_INITIALIZED) {
      // @ts-expect-error: BN is added by the SDK script
      window.BN.init({ version: "1.0" });
      // @ts-expect-error: custom property
      window.BN_INITIALIZED = true;
    }
  }, []);

  return (
    <>
      <div id="bn-root" style={{ zoom: 1.1 }}></div>
      <div
        className="bn-customerchat"
        // @ts-expect-error: custom Botnoi attributes
        bot_id="69c39e5ab114409d08f2979a"
        bot_logo="https://bn-sme-production-ap-southeast-1.s3.amazonaws.com/69c39e5ab114409d08f2979a/67b30e24-8340-47ea-89c2-d5d047fa92aa.jpg"
        locale="th"
        theme_color="#7C6FFF"
        logged_in_greeting="สวัสดีครับ! มีอะไรให้ช่วยไหม?"
        greeting_message="สวัสดีครับ 👋"
        default_open="true"
      ></div>
    </>
  );
};
