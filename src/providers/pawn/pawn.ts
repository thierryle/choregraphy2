import { Injectable } from '@angular/core';

import * as THREE from 'three';

const cDirection = { DOWN: 0, LEFT: 1, UP: 2, RIGHT: 3 };

/*
  Generated class for the PawnProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PawnProvider {
  dancer: any;
  floorWidth: number;
  floorHeight: number;
  model: any;
  rotationSpeed: number;
  
  constructor() {
  }

  createModel(dancer, floorWidth, floorHeight, font) {
    this.dancer = dancer;
    this.floorWidth = floorWidth;
    this.floorHeight = floorHeight;
    let dancerHeight = this.dancer.height * 1.5;
    let dancerWidth = this.dancer.width * 1.5;
    
    let translated;
    if (this.dancer.backstage != null) {
      translated = this.translate(this.dancer.backstage);
    } else {
      translated = this.translate(this.dancer.steps[0]);
    }
    
    this.model = new THREE.Object3D();
    this.model.position.set(translated.x, translated.y, translated.z);

    // Corps
    let meshCone = new THREE.Mesh(
      new THREE.ConeGeometry(dancerWidth / 2, dancerHeight * 0.75, 16),
      new THREE.MeshPhongMaterial({ color: this.dancer.color.toLowerCase(), wireframe: false })
    );
    this.model.add(meshCone);
    meshCone.position.set(0, dancerHeight * 0.75 / 2, 0);
    meshCone.receiveShadow = true;
    meshCone.castShadow = true;

    // Tête
    let meshSphere = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth / 2, 16, 16),
      new THREE.MeshPhongMaterial({ color: this.dancer.color.toLowerCase(), wireframe: false })
    );
    this.model.add(meshSphere);
    meshSphere.position.set(0, dancerHeight * 0.75, 0);
    meshSphere.receiveShadow = true;
    meshSphere.castShadow = true;
    
    // Cheveux ?
    let hairSphere1 = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth / 2 + 2, 16, 16, 0, 2 * Math.PI, Math.PI / 3, -2 * Math.PI / 3),
      new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: false })
    );
    this.model.add(hairSphere1);
    hairSphere1.position.set(0, dancerHeight * 0.75, 0);
    hairSphere1.receiveShadow = true;
    hairSphere1.castShadow = true;
    
    let hairSphere2 = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth / 2 + 2, 16, 16, 0, 2 * Math.PI, Math.PI / 2, -Math.PI),
      new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: false })
    );
    this.model.add(hairSphere2);
    hairSphere2.position.set(0, dancerHeight * 0.75, 0);
    hairSphere2.receiveShadow = true;
    hairSphere2.castShadow = true;
    hairSphere2.rotation.x -= Math.PI / 4;

    let hairSphere3 = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth / 2 + 2, 16, 16, 0, 2 * Math.PI, Math.PI / 2, -Math.PI),
      new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: false })
    );
    this.model.add(hairSphere3);
    hairSphere3.position.set(0, dancerHeight * 0.75, 0);
    hairSphere3.receiveShadow = true;
    hairSphere3.castShadow = true;
    hairSphere3.rotation.x -= Math.PI / 2;
    
    // Yeux
    let leftEyeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth * 0.16, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: false })
    );
    this.model.add(leftEyeSphere);
    leftEyeSphere.position.set(
      dancerWidth / 2 * 0.75 * Math.cos(Math.PI / 3),
      dancerHeight * 0.75,
      dancerWidth / 2 * 0.75 * Math.sin(Math.PI / 3));
    
    let rightEyeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(dancerWidth * 0.16, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x000000, wireframe: false })
    );
    this.model.add(rightEyeSphere);
    rightEyeSphere.position.set(
      dancerWidth / 2 * 0.75 * Math.cos(2 * Math.PI / 3),
      dancerHeight * 0.75,
      dancerWidth / 2 * 0.75 * Math.sin(2 * Math.PI / 3));
    
    // Nom
    if (this.dancer.name != null) {
      let geometry = new THREE.TextGeometry(this.dancer.name, {
				font: font,
				size: dancerHeight * 0.25,
        height: 5
      });
			geometry.center();
			
			let textMesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 'white', wireframe: false }));
			textMesh.position.x = 0;
			textMesh.position.y = dancerHeight * 0.25;
			textMesh.position.z = dancerWidth / 2 * 0.70;
      textMesh.rotation.x -= Math.PI / 12;
			this.model.add(textMesh);
    }
    
    this.updateDirection(dancer.steps[0].direction);
  
    return this.model;
  }
  
  getModel() {
    return this.model; 
  }

  /**
   * Transforme les coordonnées à deux dimensions en coordonnées à trois dimensions.
   */
  translate(point) {
    let translated = {
      x: point.x - this.floorWidth / 2,
      y: 0,
      z: point.y - this.floorHeight / 2
    }
    return translated;
  }
  
  /**
   * Met à jour la vitesse pour se rendre à l'étape suivante.
   */
  updateSpeed(nextStepNumber, stepDuration) {
    this.dancer.speedX = (this.dancer.steps[nextStepNumber].x - this.dancer.x) / stepDuration;
    this.dancer.speedY = (this.dancer.steps[nextStepNumber].y - this.dancer.y) / stepDuration;
    
    let currentAngle = this.model.rotation.y;
    let finalAngle = this.getAngle(this.dancer.steps[nextStepNumber].direction);
    if (finalAngle - currentAngle <= Math.PI) {
      this.rotationSpeed = (finalAngle - currentAngle) / stepDuration;
    } else {
      this.rotationSpeed = ((finalAngle - currentAngle) - 2 * Math.PI) / stepDuration;
    }    
  }
  
  /**
   * Met à jour la position du pion par rapport au temps écoulé
   */
  updatePos(elapsedTime) {
    this.dancer.x += this.dancer.speedX * elapsedTime;
    this.dancer.y += this.dancer.speedY * elapsedTime;
    
    let translated = this.translate(this.dancer);
    this.model.position.set(translated.x, translated.y, translated.z);
    this.model.rotation.y += this.rotationSpeed * elapsedTime;;
  }
  
  updateDirection(direction) {
    this.model.rotation.y = this.getAngle(direction);
  }
  
  getAngle(direction) {
    if (direction == cDirection.LEFT) {
      return -Math.PI / 2;
    }
    if (direction == cDirection.UP) {
      return Math.PI;
    }
    if (direction == cDirection.RIGHT) {
      return Math.PI / 2;
    }
    return 0;
  }
  
  setStep(stepNumber) {
    let step;
    if (stepNumber == -1) {
      step = this.dancer.backstage;
    } else {
      step = this.dancer.steps[stepNumber];
    }
    this.dancer.x = step.x;
    this.dancer.y = step.y;
    this.dancer.direction = step.direction;
    
    let translated = this.translate(this.dancer);
    this.model.position.set(translated.x, translated.y, translated.z);
    this.updateDirection(this.dancer.direction);
  }
  
  updateCamera(camera) {
    camera.position.set(this.model.position.x, this.model.position.y + 120, this.model.position.z + 25);
    camera.rotation.y = this.model.rotation.y + Math.PI;
  }
  
  resize(length) {
    if (length < 0 && this.model.scale.x <= 0.1) {
      return;
    }
    this.model.scale.x += length;
    this.model.scale.y += length;
    this.model.scale.z += length;
  }
}
