import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ReviewManagementComponent } from './review-management.component';

const routes: Routes = [
  { path: 'manage', component: ReviewManagementComponent }
];

@NgModule({
  declarations: [ReviewManagementComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class ReviewManagementModule {}
