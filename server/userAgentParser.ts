/**
 * Simple user agent parser to extract browser, OS, and device type.
 * 🔥 ROZSZERZONA WERSJA – rozpoznaje wszystkie popularne przeglądarki
 */
export interface ParsedUserAgent {
  browserFamily: string;
  osFamily: string;
  deviceType: string;
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  if (!userAgent) {
    return {
      browserFamily: "unknown",
      osFamily: "unknown",
      deviceType: "unknown",
    };
  }

  const ua = userAgent.toLowerCase();

  // ============================================================
  // 🔥 DETEKCJA PRZEGLĄDARKI (kolejność ma znaczenie!)
  // ============================================================
  let browserFamily = "unknown";

  // 1. Edge (musi być przed Chrome, bo Edge ma w UA "chrome")
  if (ua.includes("edg") || ua.includes("edge")) {
    browserFamily = "Edge";
  }
  // 2. Opera / Opera GX
  else if (ua.includes("opr") || ua.includes("opera")) {
    browserFamily = "Opera";
  }
  // 3. Brave (ma "brave" w UA)
  else if (ua.includes("brave")) {
    browserFamily = "Brave";
  }
  // 4. Vivaldi
  else if (ua.includes("vivaldi")) {
    browserFamily = "Vivaldi";
  }
  // 5. Arc (nowa przeglądarka)
  else if (ua.includes("arc")) {
    browserFamily = "Arc";
  }
  // 6. Firefox
  else if (ua.includes("firefox")) {
    browserFamily = "Firefox";
  }
  // 7. Safari (musi być przed Chrome, bo Safari ma "safari" ale nie "chrome")
  else if (ua.includes("safari") && !ua.includes("chrome")) {
    browserFamily = "Safari";
  }
  // 8. Chrome (najpopularniejszy)
  else if (ua.includes("chrome")) {
    browserFamily = "Chrome";
  }
  // 9. Samsung Internet
  else if (ua.includes("samsungbrowser")) {
    browserFamily = "Samsung Internet";
  }
  // 10. UC Browser
  else if (ua.includes("ucbrowser")) {
    browserFamily = "UC Browser";
  }
  // 11. Internet Explorer
  else if (ua.includes("trident") || ua.includes("msie")) {
    browserFamily = "Internet Explorer";
  }
  // 12. DuckDuckGo (przeglądarka mobilna)
  else if (ua.includes("duckduckgo")) {
    browserFamily = "DuckDuckGo";
  }
  // 13. Ecosia (przeglądarka mobilna)
  else if (ua.includes("ecosia")) {
    browserFamily = "Ecosia";
  }

  // ============================================================
  // 💻 DETEKCJA SYSTEMU OPERACYJNEGO
  // ============================================================
  let osFamily = "unknown";
  if (ua.includes("windows")) osFamily = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) osFamily = "macOS";
  else if (ua.includes("linux")) osFamily = "Linux";
  else if (ua.includes("android")) osFamily = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) osFamily = "iOS";
  else if (ua.includes("chrome os") || ua.includes("cros")) osFamily = "Chrome OS";
  else if (ua.includes("freebsd")) osFamily = "FreeBSD";
  else if (ua.includes("openbsd")) osFamily = "OpenBSD";

  // ============================================================
  // 📱 DETEKCJA TYPU URZĄDZENIA
  // ============================================================
  let deviceType = "desktop";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone") || ua.includes("blackberry")) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad") || ua.includes("kindle")) {
    deviceType = "tablet";
  } else if (ua.includes("tv") || ua.includes("smart-tv") || ua.includes("googletv")) {
    deviceType = "tv";
  } else if (ua.includes("watch") || ua.includes("apple watch")) {
    deviceType = "watch";
  }

  return {
    browserFamily,
    osFamily,
    deviceType,
  };
}