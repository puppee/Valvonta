import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatLegacySlideToggleChange as MatSlideToggleChange } from '@angular/material/legacy-slide-toggle';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { UntypedFormControl, FormGroup, Validators } from '@angular/forms';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { Helper } from 'src/app/_classes/helper';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { environment } from 'src/environments/environment';
import { Globals } from 'src/app/_common/globals';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
import {
  DatetimeAdapter,
  MTX_DATETIME_FORMATS,
} from '@ng-matero/extensions/core';
import { MomentDatetimeAdapter } from '@ng-matero/extensions-moment-adapter';
import { slideInOutRight } from 'src/app/_common/animations';
import { Feeder } from 'src/app/_classes/feeder';

export interface DialogData {
  times: string[];
}

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  providers: [
    {
      provide: DatetimeAdapter,
      useClass: MomentDatetimeAdapter,
    },
    {
      provide: MTX_DATETIME_FORMATS,
      useValue: {
        parse: {
          dateInput: 'YYYY-MM-DD',
          monthInput: 'MMMM',
          yearInput: 'YYYY',
          timeInput: 'HH:mm',
          datetimeInput: 'YYYY-MM-DD HH:mm',
        },
        display: {
          dateInput: 'YYYY-MM-DD',
          monthInput: 'MMMM',
          yearInput: 'YYYY',
          timeInput: 'HH:mm',
          datetimeInput: 'YYYY-MM-DD HH:mm',
          monthYearLabel: 'YYYY MMMM',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
          popupHeaderDateLabel: 'MMM DD, ddd',
        },
      },
    },
  ],
  animations: [slideInOutRight],
})
export class SettingsComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Boolean, ob RangeData versteckt werden soll
  @Input() hideRangeData: boolean = false;

  // Boolean, ob Settings angezeigt werden sollen
  showSettingsDiv = false;

  // Breite der Settings
  settingsDivWidth: string | undefined;

  // Boolean, ob alle Range Data vom Server angezeigt werden soll
  isCheckedShowAllRange = false;

  // Boolean, ob Anwendung im Desktop-Modus ist
  isDesktop: boolean | undefined;

  // Boolean, ob RangeData nach Feedern angezeigt werden soll
  markRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe angezeigt werden soll
  markRangeDataByHeight: boolean = false;

  // Boolean, ob Toggle-Switch "hideRangeData" disabled angezeigt werden soll
  disableRangeData: boolean = true;

  // String-Array für Ergebnis aus DateTimePickern
  times: Date[] = [];

  // Referenz zu DialogCustomRangeDataComponent
  dialogRef;

  // STartzeit vom Datetimepicker
  @Input() selectedStarttime: Date | null | undefined;

  // STartzeit vom Datetimepicker
  @Input() selectedEndtime: Date | null | undefined;

  // Einstellungen für Datetime-Picker
  type: MtxDatetimepickerType = 'datetime';
  mode: MtxDatetimepickerMode = 'auto';
  startView: MtxCalendarView = 'month';
  multiYearSelector = false;
  touchUi = false;
  twelvehour = false;
  timeInterval = 1;
  timeInput = true;

  datetimeStart = new UntypedFormControl();
  datetimeEnd = new UntypedFormControl();

  // Ausgewählte Start- und Endzeit als DateString zur Anzeige im FrontEnd
  timesAsDateStrings: String[] | undefined;

  // Booleans für Toggles (mit Default-Werten, wenn nötig)
  showAircraftLabels: boolean | undefined;
  showAirports: boolean = true;
  showOpenskyPlanes: boolean | undefined;
  showIss: boolean = true;
  showAircraftPositions: boolean | undefined = true;
  showOnlyMilitaryPlanes: boolean | undefined;

  // Boolean, ob Range Data verbunden angezeigt werden soll
  showFilteredRangeDatabyFeeder: boolean | undefined;

  // Liste an Feeder (Verlinkung zu Globals, enthält 'All Feeder'-Feeder)
  listFeeder: any;

  // Ausgewählte Feeder in Multi-Select
  selectedFeeder: Feeder[] = [];

  // Ausgewählte Feeder für Range Data in Multi-Select
  selectedFeederRangeData: Feeder[] = [];

  // App-Name
  appName: any;

  // App-Version
  appVersion: any;

  // Boolean, ob POMD-Point angezeigt werden soll
  showPOMDPoint: boolean | undefined;

  // Boolean, ob WebGL verwendet werden soll
  webgl: boolean = false;

  // Boolean, ob WebGL vom Browser unterstützt wird
  webglNotSupported: boolean = false;

  // IP-Adresse des Clients
  clientAddress: string = '';

  // IP-Adresse des Servers
  serverAddress: string = '';

  // Boolean, ob die Karte über der ISS zentriert ist
  centerMapOnIss: boolean = false;

  // Boolean, ob Geräte-Standort Basis für Berechnungen
  // sein soll
  devicePositionAsBasis: boolean = false;

  // Boolean, ob Opensky-Credentials existieren, wenn nicht disable switch
  openskyCredentialsExist: boolean = false;

  private ngUnsubscribe = new Subject();

  // Boolean, ob Rainviewer (Rain) Daten angezeigt werden sollen
  rainViewerRain: boolean = false;

  // Boolean, ob Rainviewer (Cloud) Daten angezeigt werden sollen
  rainViewerClouds: boolean = false;

  // Boolean, ob Rainviewer Forecast (Rain) Daten angezeigt werden sollen
  rainViewerRainForecast: boolean = false;

  // Liste an Maps (Verlinkung zu Map-Komponente)
  listAvailableMaps: any;

  // Default-Map-Stil value
  selectedMapStyleValue: any;

  // Ausgewählte Feeder in Multi-Select
  selectedMapsArray = new UntypedFormControl();

  // Dimmen der Map
  dimMap: boolean = true;

  // dunkle Range Ringe und dunkles Antenna-Icon
  darkStaticFeatures: boolean = true;

  // Global icon size multiplier für Plane-Icons
  sliderGlobalIconSizeValue: any = [1.3];

  // Small icon size multiplier für Plane-Icons
  sliderSmallIconSizeValue: any = [1];

  // Boolean, ob Altitude Chart angezeigt werden soll
  showAltitudeChart: boolean = true;

  // Resolution für OL-Cesium Map
  sliderCesiumResolutionValue: any = [0.5];

  constructor(
    public settingsService: SettingsService,
    public breakpointObserver: BreakpointObserver,
    public serverService: ServerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initiiere Abonnements
    this.initSubscriptions();

    // Prüfe WebGL-Support des Browsers und
    // setze Default-Boolean entsprechend
    this.checkWebglSupport();

    // Hole IP-Adresse des Servers aus Environment
    this.serverAddress = environment.baseUrl;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Prüfe WebGL-Support des Browsers und setze Default-Boolean entsprechend.
   * Sollte WebGL nicht supportet werden, wird der Toggle deaktiviert
   */
  checkWebglSupport() {
    const webglSupported = Helper.detectWebGL();
    if (webglSupported == 1) {
      this.webgl = true;
    } else if (webglSupported == 0) {
      this.webgl = false;
      console.log(
        'WebGL is currently disabled in your browser. For better performance enable WebGL.'
      );
    } else {
      this.webgl = false;
      console.log(
        'WebGL is not supported in your browser. For better performance use a browser with WebGL support.'
      );
    }

    // Deaktiviere Toggle, wenn WebGL nicht unterstützt wird
    if (!this.webgl) {
      this.webglNotSupported = true;
    }

    // Setze Boolean, ob WebGL beim Start der Anwendung benutzt werden soll
    Globals.useWebglOnStartup = this.webgl;
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          // Setze Variable auf 'Mobile'
          this.isDesktop = false;
          this.settingsDivWidth = '100%';
        } else {
          // Setze Variable auf 'Desktop'
          this.isDesktop = true;
          this.settingsDivWidth = '20rem';
        }
      });

    // Weise Liste an Feeder zu
    this.settingsService.listFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((listFeeder) => {
        this.listFeeder = listFeeder;

        // Füge default-Liste an Feedern hinzu
        this.selectedFeeder.push(...listFeeder);
        this.selectedFeederRangeData.push(...listFeeder);
      });

    // Weise App-Name und App-Version zu
    this.settingsService.appNameAndVersion$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((appNameAndVersion) => {
        this.appName = appNameAndVersion[0];
        this.appVersion = appNameAndVersion[1];
      });

    // Weise IP-Adresse des Clients zu
    this.settingsService.clientIpSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((clientIp) => {
        this.clientAddress = clientIp;
      });

    // Weise openskyCredentialsExist zu, damit Switch
    // disabled werden kann, falls diese nicht vorhanden sind
    this.settingsService.openskyCredentialsExistSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((openskyCredentialsExist) => {
        this.openskyCredentialsExist = openskyCredentialsExist;
      });

    // Weise Liste an verfügbaren Map-Stilen zu
    this.settingsService.listAvailableMapsSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((listAvailableMaps) => {
        this.listAvailableMaps = listAvailableMaps;
        this.selectCurrentlySelectedMapStyle();
      });
  }

  /**
   * Methode erstellt ein Array mit Timestamps aus der bestimmten
   * Start- und EndZeit und ruft Methode zum Senden dieser an die
   * Map-Komponente auf. Methode wird durch Button "Show Data"
   * aufgerufen
   */
  showRangeDataBetweenCustomTimestamps() {
    if (this.selectedStarttime && this.selectedEndtime) {
      // Wandle Dates in timestamps um
      let timesAsTimestamps = [
        new Date(this.selectedStarttime).getTime(),
        new Date(this.selectedEndtime).getTime(),
      ];

      this.showRangeDataBetweenTimestamps(timesAsTimestamps);
    }
  }

  /**
   * Zeigt RangeData eines bestimmten Zeitraumes an
   */
  showRangeDataBetweenTimestamps(timesAsTimestampsArray: number[]) {
    if (timesAsTimestampsArray[0] && timesAsTimestampsArray[1]) {
      // Enable Toggle-Switch "hideRangeData"
      this.disableRangeData = false;

      // Zeige ausgewählte Zeit formatiert im FrontEnd an
      this.timesAsDateStrings = [
        new Date(timesAsTimestampsArray[0]).toLocaleDateString() +
          ' ' +
          new Date(timesAsTimestampsArray[0]).toLocaleTimeString(),
        new Date(timesAsTimestampsArray[1]).toLocaleDateString() +
          ' ' +
          new Date(timesAsTimestampsArray[1]).toLocaleTimeString(),
      ];

      let selectedFeederNames = this.getNamesOfSelectedFeeder(
        this.selectedFeederRangeData
      );

      // Kontaktiere Map-Komponente, damit Server-Aufruf
      // gemacht wird mit Start- und Endzeit
      this.settingsService.showRangeDataBetweenTimestamps(
        selectedFeederNames,
        timesAsTimestampsArray
      );
    }
  }

  /**
   * Methode zeigt oder versteckt die Labels der Flugzeuge
   * @param event MatSlideToggleChange
   */
  toggleAircraftLabels(event: MatSlideToggleChange) {
    this.showAircraftLabels = event.checked;

    // Kontaktiere Map-Component und übergebe showAircraftLabels-Boolean
    this.settingsService.toggleAircraftLabels(this.showAircraftLabels);
  }

  /**
   * Methode zeigt oder versteckt die RangeData
   * @param event MatSlideToggleChange
   */
  toggleHideRangeData(event: MatSlideToggleChange) {
    this.hideRangeData = event.checked;

    // Kontaktiere Map-Component und übergebe hideRangeData-Boolean
    this.settingsService.toggleHideRangeData(this.hideRangeData);
  }

  /**
   * Methode markiert die RangeData farblich nach den Feedern
   * @param event MatSlideToggleChange
   */
  toggleMarkRangeDataByFeeder(event: MatSlideToggleChange) {
    this.markRangeDataByFeeder = event.checked;

    // Unchecke den Button "Filter by Height" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markRangeDataByHeight) {
      this.toggleMarkRangeDataByHeight(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe
    // isCheckedFilterRangeDataByFeeder-Boolean
    this.settingsService.toggleMarkRangeDataByFeeder(
      this.markRangeDataByFeeder
    );
  }

  /**
   * Methode zeigt die RangeData der laufenden Stunde an
   */
  showRangeDataLastHour() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    startTime = currentDate.setHours(currentDate.getHours() - 1);
    endTime = currentDate.setHours(currentDate.getHours() + 1);

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode zeigt die RangeData des aktuellen Tages an
   */
  showRangeDataToday() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    startTime = currentDate.setHours(0, 0, 0);
    endTime = currentDate.setHours(23, 59, 59);

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode zeigt die RangeData der letzten 7 Tage an
   */
  showRangeDataLastSevenDays() {
    let startTime;
    let endTime;

    // Bestimme aktuelle Zeit
    let currentDate = new Date();

    // Erstelle Start- und EndZeit
    endTime = currentDate.getTime();
    startTime = new Date(
      currentDate.setDate(currentDate.getDate() - 7)
    ).getTime();

    this.showRangeDataBetweenTimestamps([startTime, endTime]);
  }

  /**
   * Methode markiert die RangeData nach der Höhe
   * @param event MatSlideToggleChange
   */
  toggleMarkRangeDataByHeight(event: MatSlideToggleChange) {
    this.markRangeDataByHeight = event.checked;

    // Unchecke den Button "Filter by Feeder" und sorge für eine
    // Default-Ausgangsbasis, indem die Points wieder auf Default
    // zurückgesetzt werden. Nur ein Toggle-Switch ist zur Zeit aktiv
    // (a little hacky)
    if (this.markRangeDataByFeeder) {
      this.toggleMarkRangeDataByFeeder(
        new MatSlideToggleChange(event.source, !event.checked)
      );
    }

    // Kontaktiere Map-Component und übergebe
    // filterRangeDataByHeight-Boolean
    this.settingsService.toggleMarkRangeDataByHeight(
      this.markRangeDataByHeight
    );
  }

  /**
   * Zeige Range Data der selektierten Feeder an
   */
  selectRangeDataByFeeder() {
    let selectedFeederNames = this.getNamesOfSelectedFeeder(
      this.selectedFeederRangeData
    );

    // Kontaktiere Map-Component und übergebe selectFeeder-Name
    this.settingsService.selectRangeDataByFeeder(selectedFeederNames);
  }

  /**
   * Selektiere Flugzeuge nach dem ausgewählten Feeder
   */
  selectPlanesByFeeder() {
    let selectedFeederNames = this.getNamesOfSelectedFeeder(
      this.selectedFeeder
    );

    // Kontaktiere Map-Component und übergebe selectFeeder-Namen
    this.settingsService.selectPlanesByFeeder(selectedFeederNames);
  }

  getNamesOfSelectedFeeder(selectedFeederList: Feeder[]): string[] {
    let selectedFeederNames: string[] = [];
    for (let i = 0; i < selectedFeederList.length; i++) {
      selectedFeederNames.push(selectedFeederList[i].name);
    }
    return selectedFeederNames;
  }

  /**
   * Methode zeigt oder versteckt die Flughäfen
   * auf der Karte
   * @param event MatSlideToggleChange
   */
  toggleAirports(event: MatSlideToggleChange) {
    this.showAirports = event.checked;

    // Kontaktiere Map-Component und übergebe toggleAirports-Boolean
    this.settingsService.toggleAirports(this.showAirports);
  }

  /**
   * Refreshe Flugzeuge nach ausgewähltem Feeder
   */
  refreshSelectedFeeder() {
    if (this.selectedFeeder) {
      this.selectPlanesByFeeder();
    }
  }

  /**
   * Toggle Anzeige der Opensky Flugzeuge
   */
  toggleOpenskyPlanes(event: MatSlideToggleChange) {
    this.showOpenskyPlanes = event.checked;

    // Kontaktiere Map-Component und übergebe showOpenskyPlanes-Boolean
    this.settingsService.toggleOpenskyPlanes(this.showOpenskyPlanes);
  }

  /**
   * Toggle Anzeige der ISS
   */
  toggleIss(event: MatSlideToggleChange) {
    this.showIss = event.checked;

    // Kontaktiere Map-Component und übergebe showIss-Boolean
    this.settingsService.toggleIss(this.showIss);
  }

  /**
   * Toggle Dark Mode
   * @param event MatSlideToggleChange
   */
  toggleDarkMode(event: MatSlideToggleChange) {
    this.darkMode = event.checked;

    // Kontaktiere Map-Component und übergebe showDarkMode-Boolean
    this.settingsService.toggleDarkMode(this.darkMode);
  }

  /**
   * Toggle WebGL
   * @param event MatSlideToggleChange
   */
  toggleWebgl(event: MatSlideToggleChange) {
    this.webgl = event.checked;

    // Kontaktiere Map-Component und übergebe WebGL-Boolean
    this.settingsService.toggleWebgl(this.webgl);
  }

  /**
   * Toggle POMD-Point
   * @param event MatSlideToggleChange
   */
  togglePOMDPoint(event: MatSlideToggleChange) {
    this.showPOMDPoint = event.checked;

    // Kontaktiere Map-Component und übergebe showPOMDPoint-Boolean
    this.settingsService.togglePOMDPoint(this.showPOMDPoint);
  }

  /**
   * Ruft die Map-Komponente, damit die Karte über der
   * ISS zentriert wird
   */
  toggleCenterMapOnIss() {
    this.centerMapOnIss = !this.centerMapOnIss;

    // Kontaktiere Map-Component und übergebe centerMapOnIss-Boolean
    this.settingsService.toggleCenterMapOnIss(this.centerMapOnIss);
  }

  /**
   * Ruft die Map-Komponente, damit die aktuelle Geräte-Position
   * bestimmt werden kann
   */
  setCurrentDevicePosition() {
    // Kontaktiere Map-Component
    this.settingsService.setCurrentDevicePosition(true);
  }

  /**
   * Toggle Geräte-Position als Basis für weitere Berechnungen (Distanz, Range-Ringe)
   * @param event MatSlideToggleChange
   */
  toggleDevicePositionAsBasis(event: MatSlideToggleChange) {
    this.devicePositionAsBasis = event.checked;

    if (Globals.DevicePosition === undefined) {
      console.log(
        'Device position needs to be set before enabling this toggle!'
      );
      this.openSnackbar(
        'Device position needs to be set before enabling this toggle'
      );
      this.devicePositionAsBasis = false;
    } else {
      // Kontaktiere Map-Component und übergebe devicePositionAsBasis-Boolean
      this.settingsService.toggleDevicePositionAsBasis(
        this.devicePositionAsBasis
      );
    }
  }

  /**
   * Öffnet eine Snackbar mit einem Text für zwei Sekunden
   * @param message Text, der als Titel angezeigt werden soll
   */
  openSnackbar(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 2000,
    });
  }

  /**
   * Toggle Rainviewer (Rain)
   * @param event MatSlideToggleChange
   */
  toggleRainViewerRain(event: MatSlideToggleChange) {
    this.rainViewerRain = event.checked;

    // Kontaktiere Map-Component und übergebe Rainviewer (Rain) Boolean
    this.settingsService.toggleRainViewerRain(this.rainViewerRain);
  }

  /**
   * Toggle Rainviewer (Clouds)
   * @param event MatSlideToggleChange
   */
  toggleRainViewerClouds(event: MatSlideToggleChange) {
    this.rainViewerClouds = event.checked;

    // Kontaktiere Map-Component und übergebe Rainviewer (Clouds) Boolean
    this.settingsService.toggleRainViewerClouds(this.rainViewerClouds);
  }

  /**
   * Toggle Rainviewer Forecast(Rain)
   * @param event MatSlideToggleChange
   */
  toggleRainViewerRainForecast(event: MatSlideToggleChange) {
    this.rainViewerRainForecast = event.checked;

    // Kontaktiere Map-Component und übergebe Rainviewer Forecast (Rain) Boolean
    this.settingsService.toggleRainViewerRainForecast(
      this.rainViewerRainForecast
    );
  }

  /**
   * Methode zeigt oder versteckt die Flugzeuge
   * @param event MatSlideToggleChange
   */
  toggleAircraftPositions(event: MatSlideToggleChange) {
    this.showAircraftPositions = event.checked;

    // Kontaktiere Map-Component und übergebe showAircraftPositions-Boolean
    this.settingsService.toggleAircraftPositions(this.showAircraftPositions);
  }

  changeMapStyle() {
    if (this.selectedMapsArray.value) {
      // Kontaktiere Map-Component und übergebe
      // selectedMapsArray-Name
      this.settingsService.selectMapStyle(this.selectedMapsArray.value);
    }
  }

  selectCurrentlySelectedMapStyle() {
    for (let i = 0; i < this.listAvailableMaps.length; i++) {
      if (this.listAvailableMaps[i].isSelected) {
        this.selectedMapStyleValue = this.listAvailableMaps[i].name;
      }
    }
  }

  /**
   * Toggle Dimming der Map
   * @param event MatSlideToggleChange
   */
  toggleDimMap(event: MatSlideToggleChange) {
    this.dimMap = event.checked;

    // Kontaktiere Map-Component und übergebe DimMap-Boolean
    this.settingsService.toggleDimMap(this.dimMap);
  }

  /**
   * Löscht die aktuelle Geräte-Position auf der Map
   */
  deleteCurrentDevicePosition() {
    // Kontaktiere Map-Component
    this.settingsService.setCurrentDevicePosition(false);
  }

  /**
   * Toggle dunkle Range Ringe und dunkles Antenna-Icon
   * @param event MatSlideToggleChange
   */
  toggleDarkStaticFeatures(event: MatSlideToggleChange) {
    this.darkStaticFeatures = event.checked;

    // Kontaktiere Map-Component und übergebe darkStaticFeatures-Boolean
    this.settingsService.toggleDarkStaticFeatures(this.darkStaticFeatures);
  }

  onInputChangeGlobalIconSize(event: Event) {
    let value = (event.target as HTMLInputElement).value;

    // Kontaktiere Map-Component
    this.settingsService.setGlobalIconSize(+value);
  }

  onInputChangeSmallIconSize(event: Event) {
    let value = (event.target as HTMLInputElement).value;

    // Kontaktiere Map-Component
    this.settingsService.setSmallIconSize(+value);
  }

  resetIconSizeSlider() {
    this.sliderGlobalIconSizeValue = [1.3];
    this.sliderSmallIconSizeValue = [1];

    // Kontaktiere Map-Component
    this.settingsService.setGlobalIconSize(this.sliderGlobalIconSizeValue);
    this.settingsService.setSmallIconSize(this.sliderSmallIconSizeValue);
  }

  toggleAltitudeChart(event: MatSlideToggleChange) {
    this.showAltitudeChart = event.checked;

    // Kontaktiere Map-Component und übergebe showAltitudeChart-Boolean
    this.settingsService.toggleAltitudeChart(this.showAltitudeChart);
  }

  onInputChangeCesiumResolutionValue(event: Event) {
    let value = (event.target as HTMLInputElement).value;

    // Kontaktiere Cesium-Component
    Globals.resolution3dMapValue = +value;
    this.settingsService.setCesiumResolution(+value);
  }

  toggleShowOnlyMilitaryPlanes(event: MatSlideToggleChange) {
    this.showOnlyMilitaryPlanes = event.checked;

    // Kontaktiere Map-Component und übergebe showOnlyMilitaryPlanes-Boolean
    this.settingsService.toggleOnlyMilitaryPlanes(this.showOnlyMilitaryPlanes);
  }
}
