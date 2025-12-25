import { Injectable } from '@nestjs/common';

export interface RouteEstimate {
  distance: number; // in km
  duration: number; // in minutes
  geometry?: string; // polyline
}

@Injectable()
export class OsrmRouterService {
  private readonly baseUrl = 'http://router.project-osrm.org/route/v1/driving';

  /**
   * Tính toán lộ trình giữa các điểm tọa độ.
   * @param coordinates Mảng các cặp [lng, lat]
   */
  async calculateRoute(
    coordinates: [number, number][],
  ): Promise<RouteEstimate> {
    if (coordinates.length < 2) {
      return { distance: 0, duration: 0 };
    }

    const coordsString = coordinates.map((c) => `${c[0]},${c[1]}`).join(';');
    const url = `${this.baseUrl}/${coordsString}?overview=full&geometries=polyline`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.code !== 'Ok') {
        throw new Error(`OSRM Error: ${data.code}`);
      }

      const route = data.routes[0];
      return {
        distance: Math.round((route.distance / 1000) * 10) / 10, // km
        duration: Math.round(route.duration / 60), // minutes
        geometry: route.geometry,
      };
    } catch (err) {
      console.error('Lỗi khi gọi OSRM API:', err);
      // Fallback: Haversine distance (chim bay) nếu API lỗi
      return this.calculateFallbackRoute(coordinates);
    }
  }

  private calculateFallbackRoute(
    coordinates: [number, number][],
  ): RouteEstimate {
    let distance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      distance += this.haversineDistance(
        coordinates[i][1],
        coordinates[i][0],
        coordinates[i + 1][1],
        coordinates[i + 1][0],
      );
    }
    return {
      distance: Math.round(distance * 10) / 10,
      duration: Math.round(distance * 1.5), // Ước tính 40km/h
    };
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
