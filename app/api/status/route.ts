/**
 * @fileoverview API health check endpoint
 *
 * This module provides a simple health check endpoint that returns the API's
 * operational status, version, uptime, and current timestamp. Useful for monitoring,
 * load balancers, and service health checks.
 *
 * @module app/api/status
 */

import { NextResponse } from 'next/server'

/**
 * Application start time in milliseconds
 * Used to calculate uptime duration
 */
const startTime = Date.now()

/**
 * GET /api/status
 *
 * Health check endpoint that returns the current operational status of the API.
 * This endpoint is always accessible without authentication and provides basic
 * information about the API's health and uptime.
 *
 * @async
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - status: Service status (always "online" if responding)
 *   - version: Current API version
 *   - uptime: Time since server start in seconds (e.g., "3600s")
 *   - timestamp: Current ISO timestamp
 *
 * @requires None - Public endpoint
 *
 * @example
 * // Request: GET /api/status
 * // Response: {
 * //   status: "online",
 * //   version: "1.0.0",
 * //   uptime: "3600s",
 * //   timestamp: "2024-01-15T10:30:00.000Z"
 * // }
 */
export async function GET() {
    const uptime = Math.floor((Date.now() - startTime) / 1000)

    return NextResponse.json({
        status: 'online',
        version: '1.0.0',
        uptime: `${uptime}s`,
        timestamp: new Date().toISOString()
    })
}