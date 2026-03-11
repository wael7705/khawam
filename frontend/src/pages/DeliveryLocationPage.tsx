import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from '../i18n';
import './DeliveryLocationPage.css';

const DEFAULT_CENTER: [number, number] = [33.5138, 36.2765];
const DEFAULT_ZOOM = 13;
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ESRI_IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** نطاق التوصيل: دمشق وريفها (مستطيل تقريبي) */
const DELIVERY_ZONE = {
  minLat: 33.25,
  maxLat: 33.65,
  minLng: 36.05,
  maxLng: 36.55,
};

function isInDeliveryZone(lat: number, lng: number): boolean {
  return lat >= DELIVERY_ZONE.minLat && lat <= DELIVERY_ZONE.maxLat && lng >= DELIVERY_ZONE.minLng && lng <= DELIVERY_ZONE.maxLng;
}

type MapProps = {
  markerPosition: [number, number] | null;
  onPosition: (lat: number, lng: number) => void;
  locale: string;
};

function DeliveryLocationMap(props: MapProps) {
  const [MapRenderer, setMapRenderer] = useState<React.ComponentType<MapProps> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([L, R]) => {
      import('leaflet/dist/leaflet.css');
      const { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } = R;
      const { BaseLayer } = LayersControl;
      const icon = L.default.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      function MapClickHandler({ onPos, pos }: { onPos: (lat: number, lng: number) => void; pos: [number, number] | null }) {
        R.useMapEvents({
          click(e: { latlng: { lat: number; lng: number } }) {
            onPos(e.latlng.lat, e.latlng.lng);
          },
        });
        return pos ? <Marker position={pos} icon={icon} /> : null;
      }
      function RenderMap({ markerPosition, onPosition, locale }: MapProps) {
        return (
          <MapContainer center={markerPosition ?? DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="delivery-location-page__map" scrollWheelZoom>
            <LayersControl position="topright">
              <BaseLayer checked name={locale === 'ar' ? 'خريطة' : 'Map'}>
                <TileLayer attribution='&copy; OpenStreetMap' url={OSM_URL} />
              </BaseLayer>
              <BaseLayer name={locale === 'ar' ? 'قمر صناعي' : 'Satellite'}>
                <TileLayer attribution="Tiles &copy; Esri" url={ESRI_IMAGERY_URL} />
              </BaseLayer>
            </LayersControl>
            <MapClickHandler onPos={onPosition} pos={markerPosition} />
          </MapContainer>
        );
      }
      setMapRenderer(() => RenderMap);
    });
  }, []);

  if (!MapRenderer) return <div className="delivery-location-page__map delivery-location-page__map--loading">جاري تحميل الخريطة...</div>;
  return <MapRenderer {...props} />;
}

const OUTSIDE_ZONE_MSG_AR = 'الموقع خارج نطاق خدمة التوصيل';
const OUTSIDE_ZONE_MSG_EN = 'Location is outside delivery service area';

export function DeliveryLocationPage() {
  const { locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { serviceSlug?: string } | null;
  const serviceSlug = state?.serviceSlug ?? '';

  const [delivery_street, setDeliveryStreet] = useState('');
  const [delivery_neighborhood, setDeliveryNeighborhood] = useState('');
  const [delivery_building_floor, setDeliveryBuildingFloor] = useState('');
  const [delivery_extra, setDeliveryExtra] = useState('');
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleMapPosition = useCallback((latitude: number, longitude: number) => {
    setMarkerPosition([latitude, longitude]);
    setGpsError(null);
    setZoneError(isInDeliveryZone(latitude, longitude) ? null : (locale === 'ar' ? OUTSIDE_ZONE_MSG_AR : OUTSIDE_ZONE_MSG_EN));
  }, [locale]);

  const handleGpsClick = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError(locale === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsLoading(false);
        handleMapPosition(lat, lng);
      },
      () => {
        setGpsLoading(false);
        setGpsError(locale === 'ar' ? 'تعذر الحصول على الموقع. تأكد من تفعيل الموقع للموقع.' : 'Could not get location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [locale, handleMapPosition]);

  const handleConfirm = () => {
    const finalLat = markerPosition?.[0] ?? undefined;
    const finalLng = markerPosition?.[1] ?? undefined;
    if (markerPosition && !isInDeliveryZone(markerPosition[0], markerPosition[1])) {
      setZoneError(locale === 'ar' ? OUTSIDE_ZONE_MSG_AR : OUTSIDE_ZONE_MSG_EN);
      return;
    }
    const parts = [delivery_street.trim(), delivery_neighborhood.trim(), delivery_building_floor.trim(), delivery_extra.trim()].filter(Boolean);
    const delivery_address = parts.join('، ') || (finalLat != null && finalLng != null ? `${finalLat}, ${finalLng}` : '');
    const deliveryResult = {
      delivery_address,
      delivery_street: delivery_street.trim() || undefined,
      delivery_neighborhood: delivery_neighborhood.trim() || undefined,
      delivery_building_floor: delivery_building_floor.trim() || undefined,
      delivery_extra: delivery_extra.trim() || undefined,
      delivery_latitude: finalLat,
      delivery_longitude: finalLng,
    };
    if (serviceSlug) {
      navigate(`/order/${serviceSlug}`, { state: { deliveryResult }, replace: true });
    } else {
      navigate('/services', { state: { deliveryResult }, replace: true });
    }
  };

  const hasAddress = [delivery_street, delivery_neighborhood, delivery_building_floor, delivery_extra].some((s) => s.trim() !== '');
  const hasValidMarker = markerPosition !== null && isInDeliveryZone(markerPosition[0], markerPosition[1]);
  const canConfirm = hasAddress && (markerPosition === null || hasValidMarker);

  return (
    <div className="delivery-location-page">
      <div className="container">
        <header className="delivery-location-page__header">
          <h1>{locale === 'ar' ? 'تحديد موقع التوصيل' : 'Set Delivery Location'}</h1>
          <p>
            {locale === 'ar'
              ? 'انقر على الخريطة لتحديد الموقع أو أدخل العنوان والإحداثيات يدوياً'
              : 'Click on the map to set location or enter address and coordinates manually'}
          </p>
        </header>

        <div className="delivery-location-page__map-wrap">
          <DeliveryLocationMap
            markerPosition={markerPosition}
            onPosition={handleMapPosition}
            locale={locale}
          />
          <div className="delivery-location-page__map-actions">
            <button
              type="button"
              className="btn btn-primary delivery-location-page__gps-btn"
              onClick={handleGpsClick}
              disabled={gpsLoading}
            >
              <MapPin size={18} />
              {gpsLoading ? (locale === 'ar' ? 'جاري التحديد...' : 'Getting location...') : (locale === 'ar' ? 'تحديد موقعي على الخريطة' : 'Use my location')}
            </button>
          </div>
        </div>
        {(zoneError || gpsError) && (
          <div className="delivery-location-page__zone-error" role="alert">
            {zoneError ?? gpsError}
          </div>
        )}

        <div className="delivery-location-page__form">
          <div className="delivery-location-page__field">
            <label>{locale === 'ar' ? 'الشارع' : 'Street'}</label>
            <input
              type="text"
              className="step-input"
              value={delivery_street}
              onChange={(e) => setDeliveryStreet(e.target.value)}
              placeholder={locale === 'ar' ? 'الشارع...' : 'Street...'}
            />
          </div>
          <div className="delivery-location-page__field">
            <label>{locale === 'ar' ? 'الحي' : 'Neighborhood'}</label>
            <input
              type="text"
              className="step-input"
              value={delivery_neighborhood}
              onChange={(e) => setDeliveryNeighborhood(e.target.value)}
              placeholder={locale === 'ar' ? 'الحي...' : 'Neighborhood...'}
            />
          </div>
          <div className="delivery-location-page__field">
            <label>{locale === 'ar' ? 'المبنى / الطابق' : 'Building / Floor'}</label>
            <input
              type="text"
              className="step-input"
              value={delivery_building_floor}
              onChange={(e) => setDeliveryBuildingFloor(e.target.value)}
              placeholder={locale === 'ar' ? 'مبنى، طابق...' : 'Building, floor...'}
            />
          </div>
          <div className="delivery-location-page__field">
            <label>{locale === 'ar' ? 'تفاصيل إضافية' : 'Extra details'}</label>
            <textarea
              className="step-textarea"
              rows={2}
              value={delivery_extra}
              onChange={(e) => setDeliveryExtra(e.target.value)}
              placeholder={locale === 'ar' ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
            />
          </div>
          <div className="delivery-location-page__actions">
            <button
              type="button"
              className="btn btn-primary delivery-location-page__confirm"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {locale === 'ar' ? 'تأكيد الموقع' : 'Confirm Location'}
            </button>
            <button
              type="button"
              className="btn delivery-location-page__back"
              onClick={() => (serviceSlug ? navigate(`/order/${serviceSlug}`) : navigate('/services'))}
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
