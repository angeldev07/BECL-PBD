import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StepContainerComponent } from './pages/step-container/step-container.component';
import { PersonalInfoComponent } from './pages/personal-info/personal-info.component';
import { ServiceComponent } from './pages/service/service.component';
import { EventComponent } from './pages/event/event.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'personal-info', component: PersonalInfoComponent },
      { path: 'service', component: ServiceComponent},
      { path: 'event', component: EventComponent}
    ],
    component: StepContainerComponent
  }
]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class StepRoutingModule { }
