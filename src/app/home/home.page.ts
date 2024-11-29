import { Component } from '@angular/core';

declare var google: any; // Para usar los tipos de google.maps

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  center: google.maps.LatLngLiteral = { lat: -13.6558, lng: -73.3877 }; // Plaza de Armas de Andahuaylas, Apurímac, Perú
  zoom = 13; // Nivel de zoom inicial
  origenMarker: google.maps.LatLngLiteral | null = null; // Marcador de origen
  destinoMarker: google.maps.LatLngLiteral | null = null; // Marcador de destino
  tarifaPorKilometro: number = 1.00; // Tarifa en soles por kilómetro
  costoTotal: number = 0; // Costo total del viaje
  qrCodeData: string = ''; // Datos del código QR
  showQRCode: boolean = false; // Control para mostrar el QR
  numeroYape: string = '973649008'; // Número de celular para Yape

  directionsService = new google.maps.DirectionsService(); // Servicio para calcular direcciones
  directionsRenderer = new google.maps.DirectionsRenderer(); // Renderer para mostrar la ruta

  map!: google.maps.Map;

  // Inicializar el mapa y configurar el renderer
  ngOnInit() {
    const mapOptions = {
      center: this.center,
      zoom: this.zoom,
    };

    this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, mapOptions);
    this.directionsRenderer.setMap(this.map); // Vincula el DirectionsRenderer al mapa

    // Habilitar clics en el mapa
    this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      this.mapClicked(event);
    });
  }

  // Método para manejar los clics en el mapa y seleccionar puntos
  mapClicked(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const position = event.latLng.toJSON();

      // Si aún no se ha definido el origen, lo establecemos
      if (!this.origenMarker) {
        this.origenMarker = position;
        console.log("Origen establecido:", this.origenMarker);

      // Si el origen ya está establecido pero el destino no, establecemos el destino
      } else if (!this.destinoMarker) {
        this.destinoMarker = position;
        console.log("Destino establecido:", this.destinoMarker);

        // Ahora que tenemos origen y destino, calculamos la ruta
        this.calculateRoute();

      // Si ambos puntos ya están definidos, reiniciamos el origen y limpiamos la ruta
      } else {
        this.origenMarker = position;
        this.destinoMarker = null;
        this.directionsRenderer.setDirections({ routes: [] }); // Limpiar la ruta previa
        console.log("Reinicio de origen. Establecer nuevo destino.");
      }
    }
  }

  // Método para calcular la mejor ruta entre el origen y el destino
  calculateRoute() {
    if (this.origenMarker && this.destinoMarker) {
      const request = {
        origin: new google.maps.LatLng(this.origenMarker.lat, this.origenMarker.lng),
        destination: new google.maps.LatLng(this.destinoMarker.lat, this.destinoMarker.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      this.directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result); // Dibujar la ruta en el mapa
          this.iniciarCobro(); // Calcular la distancia y el costo
        } else {
          console.error('Error al calcular la ruta: ', status);
        }
      });
    } else {
      console.error('Por favor selecciona ambos puntos (origen y destino).');
    }
  }

  // Método para calcular el costo total según la distancia
  iniciarCobro() {
    if (this.origenMarker && this.destinoMarker) {
      const service = new google.maps.DistanceMatrixService();

      const origen = new google.maps.LatLng(this.origenMarker.lat, this.origenMarker.lng);
      const destino = new google.maps.LatLng(this.destinoMarker.lat, this.destinoMarker.lng);

      service.getDistanceMatrix(
        {
          origins: [origen],
          destinations: [destino],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response: any, status: any) => {
          if (status === 'OK') {
            const distancia = response.rows[0].elements[0].distance.value / 1000; // Distancia en kilómetros
            this.costoTotal = distancia * this.tarifaPorKilometro;
            console.log(`Distancia: ${distancia} km, Costo total: S/${this.costoTotal}`);
            this.generarQRCode(); // Generar el código QR después de calcular el costo
          } else {
            console.error(`Error al calcular la distancia: ${status}`);
          }
        }
      );
    } else {
      console.error('Por favor selecciona ambos puntos (inicio y destino).');
    }
  }

  // Método para generar el código QR para Yape
  generarQRCode() {
    const enlaceYape = `https://www.yape.com.pe/pagar?monto=${this.costoTotal.toFixed(2)}&referencia=Pasaje&codigo=${this.numeroYape}`;
    this.qrCodeData = enlaceYape;
    this.showQRCode = true; // Muestra el código QR
  }
}
