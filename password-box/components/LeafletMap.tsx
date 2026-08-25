import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '../constants/theme';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  icon?: string;
  color?: string;
}

interface LeafletMapProps {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  markers?: MapMarker[];
  style?: object;
  onMapReady?: () => void;
  onMarkerPress?: (markerId: string) => void;
  onTap?: (latitude: number, longitude: number) => void;
  showMyLocation?: boolean;
  followLocation?: boolean;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
}

function generateLeafletHTML(
  center: { latitude: number; longitude: number },
  zoom: number,
  markers: MapMarker[],
  showMyLocation: boolean,
  followLocation: boolean,
  locationLat: number | null,
  locationLng: number | null
): string {
  const markersJSON = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.latitude,
      lng: m.longitude,
      title: m.title,
      icon: m.icon || 'location_on',
      color: m.color || '#6C63FF',
    }))
  );

  const initialLat = locationLat ?? center.latitude;
  const initialLng = locationLng ?? center.longitude;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; background:#0F0E17; }
  .leaflet-control-zoom { border:none !important; }
  .leaflet-control-zoom a { background:#1A1A2E !important; color:#FFFFFE !important; border-color:#2E2E50 !important; }
  .leaflet-control-zoom a:hover { background:#232342 !important; }
  .leaflet-control-attribution { display:none !important; }
  .equipment-marker {
    background:none; border:none;
  }
  .equipment-marker-inner {
    width:32px; height:32px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:16px; color:white; font-weight:bold;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    border: 2px solid white;
  }
  .location-marker {
    width:20px; height:20px; border-radius:50%;
    background:#6C63FF; border:3px solid white;
    box-shadow: 0 0 0 3px rgba(108,99,255,0.3), 0 2px 6px rgba(0,0,0,0.3);
  }
  .accuracy-circle {
    background: rgba(108,99,255,0.15);
    border: 1px solid rgba(108,99,255,0.3);
  }
  .crosshair {
    position:absolute; top:50%; left:50%;
    transform:translate(-50%,-50%);
    pointer-events:none; z-index:1000;
  }
  .crosshair::before, .crosshair::after {
    content:''; position:absolute; background:rgba(108,99,255,0.8);
  }
  .crosshair::before { width:2px; height:24px; left:50%; top:50%; transform:translate(-50%,-50%); }
  .crosshair::after { width:24px; height:2px; left:50%; top:50%; transform:translate(-50%,-50%); }
  .map-btn {
    position:absolute; z-index:1000;
    width:44px; height:44px; border-radius:22px;
    background:#1A1A2E; border:1px solid #2E2E50;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; color:#FFFFFE; font-size:20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .map-btn:hover { background:#232342; }
  #locate-btn { bottom:100px; right:16px; }
  #cache-btn { bottom:156px; right:16px; }
  #cache-indicator {
    position:absolute; top:16px; left:50%; transform:translateX(-50%);
    z-index:1000; background:rgba(26,26,46,0.9); color:#A7A9BE;
    padding:6px 14px; border-radius:16px; font-size:12px;
    border:1px solid #2E2E50; display:none;
    font-family: -apple-system, sans-serif;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="crosshair" id="crosshair" style="display:none"></div>
<div id="cache-indicator"></div>
<button class="map-btn" id="locate-btn" title="Ma position">📍</button>
<button class="map-btn" id="cache-btn" title="Cache la zone">💾</button>

<script>
var map = L.map('map',{
  zoomControl:false,
  attributionControl:false
}).setView([${initialLat},${initialLng}],${zoom});

L.control.zoom({position:'topleft'}).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  tileSize:256
}).addTo(map);

var equipmentMarkers = {};
var userMarker = null;
var userCircle = null;
var selectMode = false;
var selectMarker = null;

function createEquipmentIcon(color, title) {
  return L.divIcon({
    className:'equipment-marker',
    html:'<div class="equipment-marker-inner" style="background:'+color+'">'+title.charAt(0).toUpperCase()+'</div>',
    iconSize:[32,32],
    iconAnchor:[16,16]
  });
}

function addMarker(id,lat,lng,title,color) {
  if(equipmentMarkers[id]) {
    map.removeLayer(equipmentMarkers[id]);
  }
  var marker = L.marker([lat,lng],{icon:createEquipmentIcon(color,title)}).addTo(map);
  marker.bindPopup('<b>'+title+'</b>');
  marker.on('click',function(){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker_press',id:id}));
  });
  equipmentMarkers[id] = marker;
}

function removeMarker(id) {
  if(equipmentMarkers[id]) {
    map.removeLayer(equipmentMarkers[id]);
    delete equipmentMarkers[id];
  }
}

function setUserLocation(lat,lng,accuracy) {
  if(userMarker) map.removeLayer(userMarker);
  if(userCircle) map.removeLayer(userCircle);
  userMarker = L.marker([lat,lng],{
    icon:L.divIcon({className:'location-marker',iconSize:[20,20],iconAnchor:[10,10]})
  }).addTo(map);
  if(accuracy) {
    userCircle = L.circle([lat,lng],{
      radius:accuracy,
      className:'accuracy-circle'
    }).addTo(map);
  }
}

var markers = ${markersJSON};
markers.forEach(function(m){ addMarker(m.id,m.lat,m.lng,m.title,m.color); });

if(${showMyLocation} && ${locationLat} !== null && ${locationLng} !== null) {
  setUserLocation(${locationLat},${locationLng},0);
}

if(${followLocation}) {
  map.setView([${locationLat ?? initialLat},${locationLng ?? initialLng}],18);
}

map.on('click',function(e){
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type:'map_tap',
    latitude:e.latlng.lat,
    longitude:e.latlng.lng
  }));
});

map.on('moveend',function(){
  var c = map.getCenter();
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type:'map_move',
    latitude:c.lat,
    longitude:c.lng,
    zoom:map.getZoom()
  }));
});

document.getElementById('locate-btn').addEventListener('click',function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'locate_press'}));
});

document.getElementById('cache-btn').addEventListener('click',function(){
  var c = map.getCenter();
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type:'cache_press',
    latitude:c.lat,
    longitude:c.lng,
    zoom:map.getZoom()
  }));
});

window.addEventListener('message',function(event){
  var data = JSON.parse(event.data);
  if(data.type==='add_marker') {
    addMarker(data.id,data.lat,data.lng,data.title,data.color);
  } else if(data.type==='remove_marker') {
    removeMarker(data.id);
  } else if(data.type==='set_location') {
    setUserLocation(data.lat,data.lng,data.accuracy);
    if(data.follow) map.setView([data.lat,data.lng],map.getZoom());
  } else if(data.type==='set_view') {
    map.setView([data.lat,data.lng],data.zoom);
  } else if(data.type==='invalidate') {
    map.invalidateSize();
  }
});

window.ReactNativeWebView.postMessage(JSON.stringify({type:'map_ready'}));
</script>
</body>
</html>`;
}

export default function LeafletMap({
  center = { latitude: 48.8566, longitude: 2.3522 },
  zoom = 16,
  markers = [],
  style,
  onMapReady,
  onMarkerPress,
  onTap,
  showMyLocation = false,
  followLocation = false,
  locationLatitude = null,
  locationLongitude = null,
}: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  const isReady = useRef(false);

  useEffect(() => {
    if (isReady.current && webViewRef.current) {
      markers.forEach((m) => {
        webViewRef.current?.postMessage(
          JSON.stringify({
            type: 'add_marker',
            id: m.id,
            lat: m.latitude,
            lng: m.longitude,
            title: m.title,
            color: m.color || Colors.primary,
          })
        );
      });
    }
  }, [markers]);

  useEffect(() => {
    if (isReady.current && webViewRef.current && showMyLocation && locationLatitude != null && locationLongitude != null) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'set_location',
          lat: locationLatitude,
          lng: locationLongitude,
          accuracy: 0,
          follow: followLocation,
        })
      );
    }
  }, [locationLatitude, locationLongitude, showMyLocation, followLocation]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'map_ready':
            isReady.current = true;
            onMapReady?.();
            break;
          case 'marker_press':
            onMarkerPress?.(data.id);
            break;
          case 'map_tap':
            onTap?.(data.latitude, data.longitude);
            break;
        }
      } catch {}
    },
    [onMapReady, onMarkerPress, onTap]
  );

  const html = generateLeafletHTML(
    center,
    zoom,
    markers,
    showMyLocation,
    followLocation,
    locationLatitude,
    locationLongitude
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        originWhitelist={['*']}
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
