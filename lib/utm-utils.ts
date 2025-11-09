/**
 * Utilities for managing tracking parameters throughout the conversion funnel
 * Supports UTMs and BuckPay-specific parameters (ref, src, sck)
 */

export interface TrackingData {
  // UTM Parameters
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_id?: string
  utm_term?: string
  utm_content?: string
  // BuckPay Parameters
  ref?: string
  src?: string
  sck?: string
}

/**
 * Get tracking parameters from the current URL
 * Includes UTM parameters and BuckPay-specific parameters
 */
export const getTrackingParameters = (): TrackingData => {
  if (typeof window === "undefined") return {}

  const params = new URLSearchParams(window.location.search)
  const tracking: TrackingData = {}

  const trackingKeys: (keyof TrackingData)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_id",
    "utm_term",
    "utm_content",
    "ref",
    "src",
    "sck",
  ]

  for (const key of trackingKeys) {
    const value = params.get(key)
    if (value) tracking[key] = value
  }

  if (Object.keys(tracking).length > 0) {
    console.log("[v0] Tracking Parameters from URL:", tracking)
  }

  return tracking
}

/**
 * Store tracking parameters in localStorage for persistence across page reloads
 * Using localStorage instead of sessionStorage for persistent tracking
 */
export const storeTrackingParameters = (tracking: TrackingData): void => {
  if (typeof window !== "undefined" && Object.keys(tracking).length > 0) {
    try {
      localStorage.setItem("tracking_data", JSON.stringify(tracking))
      console.log("[v0] Tracking parameters stored in localStorage:", tracking)
    } catch (e) {
      console.warn("[v0] Failed to store tracking parameters:", e)
    }
  }
}

/**
 * Retrieve stored tracking parameters from localStorage
 * Using localStorage instead of sessionStorage
 */
export const getStoredTrackingParameters = (): TrackingData => {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem("tracking_data")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn("[v0] Failed to retrieve tracking parameters:", e)
  }

  return {}
}

/**
 * Get all available tracking data with URL parameters taking priority
 * New function name to reflect expanded tracking scope
 */
export const getAllTrackingData = (): TrackingData => {
  const fromURL = getTrackingParameters()
  const fromStorage = getStoredTrackingParameters()

  // URL parameters take priority over stored ones
  return { ...fromStorage, ...fromURL }
}

/**
 * Format tracking data for display/logging
 */
export const formatTrackingForLogging = (tracking: TrackingData): string => {
  const parts = Object.entries(tracking)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
  return parts.length > 0 ? parts.join("&") : "No tracking parameters"
}

export const getUTMParameters = getTrackingParameters
export const storeUTMParameters = storeTrackingParameters
export const getStoredUTMParameters = getStoredTrackingParameters
export const getAllUTMData = getAllTrackingData
export const formatUTMForLogging = formatTrackingForLogging

export interface UTMData extends TrackingData {}
