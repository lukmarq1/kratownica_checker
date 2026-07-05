/**
 * Simple user agent parser to extract browser, OS, and device type.
 * This is a lightweight implementation without external dependencies.
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

  // Detect browser
  let browserFamily = "unknown";
  if (ua.includes("chrome")) browserFamily = "Chrome";
  else if (ua.includes("firefox")) browserFamily = "Firefox";
  else if (ua.includes("safari")) browserFamily = "Safari";
  else if (ua.includes("edge")) browserFamily = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browserFamily = "Opera";
  else if (ua.includes("trident")) browserFamily = "IE";

  // Detect OS
  let osFamily = "unknown";
  if (ua.includes("windows")) osFamily = "Windows";
  else if (ua.includes("mac")) osFamily = "macOS";
  else if (ua.includes("linux")) osFamily = "Linux";
  else if (ua.includes("android")) osFamily = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) osFamily = "iOS";

  // Detect device type
  let deviceType = "desktop";
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    deviceType = "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    deviceType = "tablet";
  }

  return {
    browserFamily,
    osFamily,
    deviceType,
  };
}
