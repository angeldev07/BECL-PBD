import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { IStep } from 'src/app/data/interfaces/step-item.interface';
import { StepService } from '../../../../shared/services/step.service';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';


@Component({
  selector: 'app-step-container',
  templateUrl: './step-container.component.html',
  styleUrls: ['./step-container.component.css']
})
export class StepContainerComponent implements OnInit{

  stepItems: IStep[] = [
    {
      step: 1,
      title: 'Información Personal'
    },
    {
      step: 2,
      title: 'Seleccionar Servicio'
    },
    {
      step: 3,
      title: 'Datos del evento'
    },
    {
      step: 4,
      title: 'Resumen'
    }
  ];

  private confirmExit = false;

  currentStep = 1;
  // routes = [['/eventos/personal-info'], ['/eventos/service'],['/eventos/event']]
  constructor(
    private stepService: StepService,
    private router: Router,
    private authS: AuthService
  ){ }


  ngOnInit(): void {
    //Pregunto si ya se guardo el step y lo leo  
    this.currentStep = localStorage.getItem('step') ? parseInt(localStorage.getItem('step')!) : 1;
    
    // Nos dirigimos al paso en el que se haya quedado el usuario 
    this.stepService.changeStepValue(this.currentStep);
    
    //me suscribo al cambio de paso para que se renderice
    this.stepService.currentStep.subscribe({next: value => this.currentStep = value})

    // Validamos 
    if(! this.authS.validateToken())
      this.router.navigate(['/auth'])
  }


  // saveCurrentStep(){
  //   // Guardo el estado actual del step
  //   localStorage.setItem('step', JSON.stringify({step: this.currentStep}));
  // }

  // goToCurrentStep(){    
  //   this.router.navigate(this.routes[this.currentStep-1]);
  // }

}
