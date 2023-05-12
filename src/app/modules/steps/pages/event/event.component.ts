import { Component, OnInit, EventEmitter } from '@angular/core';
import { StepService } from 'src/app/shared/services/step.service';
import { ReservationTicketService } from '../../services/reservation-ticket.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { EventsHour } from 'src/app/data/models/events.model';
import { holidays } from 'src/app/data/const/holidays.const';
import Swal from 'sweetalert2'
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { semilleros } from 'src/app/data/const/semilleros.const';

@Component({
  selector: 'app-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.css']
})
export class EventComponent implements OnInit{

  //Variable para controlar el step 4
  private _scheduleEvent = false;

  //variable para controlar la pantalla de carga.
  public showLoading = false;

  //Varibales para controlar la fecha minima (siempre el dia actual) y la fecha máxima (sin limites)
  public minDate: Date = new Date();
  public maxDate!: Date 
  private _selectFDate!: Date;
  
  // Variable para testar la respueta del back 
  public start: EventsHour[] = []

  //Lista de las horas de finalización
  public endHours: any = [ ];

  //variable para obtener la respuesta final del backend.
  public finalRes: any;

  //variable para llevar el control del cierre de sesión
  private _countdown = 45;

  public departments = [...semilleros];

  public seedbeds = this.departments[0].seedbeds;
  

  //Formulario reactivo para el control de la informacion del evento
  public eventForm: FormGroup = this.fb.group({
    title: [ , [Validators.required] ],
    people: [ , [ Validators.required] ],
    date:  [ Date , [Validators.required ] ],
    start: [, [Validators.required] ],
    end: [, [Validators.required] ]
  });

  constructor(
    private stepService: StepService,
    private eventService: EventsService,
    private ticket: ReservationTicketService,
    private fb: FormBuilder,
    private auth: AuthService
  ){}

  ngOnInit(): void {
    this.eventForm.controls['people'].setValidators(Validators.min(this.setMinPeopleValitador()));
    if(this.Ticket.service.physicalSpace == 'S')
      this.eventForm.controls['title'].setValue(this.seedbeds[0], {eventEmitter: false})
  }

  get sheduleEvent(){
    return this._scheduleEvent;
  }

  get typeService(){
    // this.ticket.reservationTicket.service.physicalSpace
    return ! localStorage.getItem('ticket') ? this.ticket.reservationTicket.service.physicalSpace : JSON.parse(localStorage.getItem('ticket')!)['service']['physicalSpace']
  }

  get Ticket(){
    return {...this.ticket.reservationTicket}
  }

  get disableDates(): Date[]{
    return holidays
  }

  get countDown(){
    return this._countdown
  }

  set changeSheduleEvent(value: boolean){
    this._scheduleEvent = value;
  }

  //Método para regresar al step 2
  public back(){
    this.stepService.changeStepValue(2);
  }

  //Método para regresar del step 4 al 3
  public regresar(){
    this.changeSheduleEvent = false;
    this.stepService.changeStepValue(3);
  }

  /**
   * Método para enviar la información al backend y que se agende el evento/capacitación 
   */
  public submit(){

    //Guardamos toda la información en el ticket de reserva
    this.saveEventInfo()
    this.stepService.changeStepValue(4);
    this.changeSheduleEvent = true;
    this.saveEventOnCalendar();
  }

  /**
   * Método para determinar la hora en formato 12h indicando si es a.m. o p.m
   * @param hour correspondiente a la hora a formatear
   * @returns Un string indicando la hora en formato pm o am.
   */
  public changeTwelveHour(hour: number){
    return hour > 12 ? `${Math.abs(hour - 12)}:00 pm` : `${hour}:00 am`
  }

  /**
   * Método para devolver la lista de horas de finalización una vez se haya seleccionado una hora de inicio
   * @param event recibe el evento del componente p-dropdown para obtener el value (possibles)
   * @returns No retorna nada, solo genera la lista de horas de finalización para cada hora de inicio
   */
  public endTimes(event: any){
    //Se borra cualquier elemento que ya exista primero
    this.endHours.splice(0, this.endHours.length); 
    
    //Se obtienen las horas posibles de finalizacion
    const { possible } = event.value;
    
    //Teniendo las horas, se recorre cada hora y se añade a la lista de endHours
    possible.forEach( (hour:number) => {
      this.endHours.push({ hour: `${this.changeTwelveHour(hour)}` })
    });

  }

  /**
   * Método para 'limpiar' el dropdown de las horas de finalización  
   * @returns 
   */
  public clearEndHoursList(){
    //Si aún no tenemos un valor, quiere decir que no hemos selecionado una hora de inicio, por tanto, no se hace nada.
    if(! this.eventForm.controls['end'].value )
      return  
    
    // Se resetea el valor del formulario en su campo 'end'
    this.eventForm.controls['end'].setValue(' ', {emitEvent: false})
  } 

  public saveDate(){
    this._selectFDate = new Date(this.eventForm.controls['date']?.value);
  }

  //Método de testeo para el formateo de horas
  public getFormatDate(){

    //Validamos si se volvio a seleccionar la misma fecha para evitar tener que volver a hacer la petición. 
    if(this._selectFDate != null &&  (this._selectFDate.getTime() == new Date(this.eventForm.controls['date']?.value).getTime()))
      return

    //limpio lo que tenga seleccionado antes en las horas de inicio
    if(this.start.length > 0)
      this.start.length = 0;  
    //obtengo la fecha seleccionada
    //se debe de tener al  inicio: T00:00:00-05:00 Y para la hora final T23:59:59.999999-05:00
    const fecha = new Date(this.eventForm.controls['date']?.value).toISOString().split('T');
    const fechaInicio = `${fecha[0]}T00:00:00-05:00`
    const fechaFinal = `${fecha[0]}T23:59:59.999999-05:00`
    
    //obtengo el token del localStorage
    const token = localStorage.getItem('token') || '';

    this.eventService.getEvents({token, dates:[fechaInicio, fechaFinal], type:this.typeService }).subscribe(
      {
        next: hours  =>{
          if (hours.length > 0){
            this.start = hours;
            this.saveDate();
          }
          else{
            Swal.fire({
              title: '¡Error!',
              text: `Lo sentimos, pero paraece ser que para el ${fecha[0]} no hay espacios disponibles para realizar la solicitud. Intente con un nuevo día.`,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            })
            this.eventForm.controls['date'].setValue(null, {eventEmitter: false})
          } 

        }
      }
    )
  }

  /**
   * Método para guarda la información ingresada en este punto del formulario.
   */
  public saveEventInfo(){
    const event = {
      title: this.eventForm.controls['title'].value,
      people: this.eventForm.controls['people'].value,
      date: new Date(this.eventForm.controls['date']?.value).toISOString().split('T')[0],
      start: this.eventForm.controls['start'].value['hours'],
      end: this.eventForm.controls['end'].value['hour']
    }

    this.ticket.reservationTicket.event = {...event };
    this.ticket.saveOnLocalStorage();
  }

  /**
   * Método para extraer la información del ticket y enviarla a agendar.
   */
  public saveEventOnCalendar(){
    const token = localStorage.getItem('token') || ''
    const hours = this.getFormatHour();
    const title = `${this.Ticket.service.physicalSpace}: ${ this.Ticket.service.physicalSpace == 'S' ? this.eventForm.controls['title'].value['name'] : this.Ticket.event.title } `;
    const data = {

      calendar: {
        title,
        dates: [`${this.Ticket.event.date}T${hours[0]}:00:00-05:00`,`${this.Ticket.event.date}T${hours[1]}:00:00-05:00`],
        emails: [ this.Ticket.personalInformation.email ],
      },

      support: {
        type: this.Ticket.service.physicalSpace,
        date: `${this.Ticket.event.date}`,
        title: title.substring(3),
        dependence: this.Ticket.personalInformation.faculty.toLowerCase(),
        people: this.Ticket.event.people,
        name: this.Ticket.personalInformation.name.toLowerCase(),
        code: this.Ticket.personalInformation.code,
        hours: [this.Ticket.event.start, this.Ticket.event.end]
      }
    }
    console.log(data)
    //Despliego la animación de carga.
    this.showLoading = true;
    //me suscribo a la respuesta del backend.
    this.eventService.saveEvent({token, data}).subscribe(
      { next: res => {
          this.finalRes = res; 
          this.showLoading = false;
          // this.startTimer();
      }
     })
  }

  /**
   * Método para retorna de manera formateada las horas de entrada y salida para el evento.
   * @returns arreglo con las horas de entrada y salida respectivamente 
   */
  private getFormatHour(){
    //guardo las horas en un arreglo para poder usarlas mas adelante.
    const simpleHours = [parseInt(this.Ticket.event.start.split(':')[0]), parseInt(this.Ticket.event.end.split(':')[0])];
    const start = this.Ticket.event.start.includes('pm') ? simpleHours[0]+12 : `${simpleHours[0] > 9  ? simpleHours[0]: '0'+simpleHours[0]}`
    const end = this.Ticket.event.end.includes('pm') ? simpleHours[1]+12 : `${simpleHours[1] > 9 ? simpleHours[1]: '0'+simpleHours[1]}`
    return [start, end]
  }

  /**
   * Método para determinar si un input es invalido. Se aplica si el input fue tocado y es invalido. 
   * @param input nombre del input (control) para aplicar la validación
   * @returns true o false 
   */
  public invalidInput(input: string) {
    return this.eventForm.controls[input].touched && this.eventForm.controls[input].invalid
  }

  /**
   * Método para establecer la cantidad minima de personas para prestar el espacio o servicio.
   * @returns la cantidad de personas minimas para prestar el espacio o servicio
   */
  public setMinPeopleValitador(){
    const minValidators: {[key:string]: number} = {
      'A': 30,
      'S': 5,
      'ST': 20,
      'BD': 8
    }
    return minValidators[this.ticket.reservationTicket.service.physicalSpace];
  }

  public getErrorPeopleMessage(){
    const minPeople = this.setMinPeopleValitador();

    if(this.ticket.reservationTicket.service.type == 'prestamo'){
      return `Para reservar el espacio solicitado se requieren como minimo ${minPeople} personas;`
    }

    return `Para realizar la capacitación solicitada se requieren como minimo ${minPeople} personas`;
  }

  /**
   * Método que retorna el mensaje de cierre del evento agendado.
   * @returns mensaje final acorde al tipo de evento
   */
  public getFinalMessage(){
    const message: {[key:string]: string} = {
      'A': 'el préstamo del auditorio',
      'S' : 'el préstamo de la sala de semilleros',
      'BD': 'la capacitación en las base de datos'
    }

    return message[this.Ticket.service.physicalSpace]
  }

  /**
   * Método para iniciar el contador de cierre de sesión cuando el usuario descargue el documento. 
   */
  public startTimer(){
    const interval = setInterval(() => {
      if(this._countdown > 0) {
        this._countdown--;
      } else {
        this.auth.logout();
        clearInterval(interval);
      }
    }, 1000);

  }

  /**
   * Método para hacer el llamado al backend y descargar el documento.
   */
  public download(){

    //extramemos la data necesaria del hacer el llamado. 
    const data = {
      name: this.finalRes.nameFile,
      type: this.Ticket.service.physicalSpace
    }

    this.eventService.downloadDocument( data ).subscribe((response: any) => {
      // creamos el objto blob, se le pasa la response del backend y se le configura el type 'application/pdf' para que se descargue en pdf.
      const blob = new Blob([response], { type: 'application/pdf' });

      //se crea una url para el blol
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a'); //se crea el elemento virtual y se le asigna el evento click para que se descargue el doc
      link.href = downloadUrl;
      link.download = this.finalRes.nameFile;
      link.click();

      //un timeout para eliminar el objeto pasado 1segundo. 
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl); // libera la memoria utilizada por el objeto URL
        link.remove(); // elimina el enlace del DOM
      }, 1000);

    });
  }

  public selectSeedbeds(event: any){
    const { department,  seedbeds } = event.value
    console.log(department);
    
    this.seedbeds = seedbeds;
    this.Ticket.personalInformation.faculty = department
  }
}
