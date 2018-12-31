import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TimeHandlerProvider } from '../../providers/time-handler/time-handler';
import { PawnProvider } from '../../providers/pawn/pawn';
import * as THREE from 'three';
import { UtilProvider } from '../../providers/util/util';

declare var require: any;
var OrbitControls = require('three-orbit-controls')(THREE);
var OBJLoader = require('three-obj-loader');
OBJLoader(THREE);

//const cDirection = { DOWN: 0, LEFT: 1, UP: 2, RIGHT: 3 };

/**
 * npm install three --save
 * npm install three-orbit-controls --save
 * npm install three-obj-loader --save
 */
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  @ViewChild('container') container: ElementRef;
  @ViewChild('music') music: any;
  
  containerElement: any;
  ctx: any;

  scene: any;
  camera: any;
  dancerCamera: any;
  currentCamera: any;
  renderer: any;
  controls: any;
  pawns: any[];
  width: number;
  height: number;
  
  hudScene: any;
  hudCamera: any;
  hudTexture: any;
  
  meshFloor: any;
  floorWidth: number;
  floorHeight: number;
  floorTexture: any;
  font: any;
  
  currentStepNumber: number = 0;
  steps: any[];
  backstage: any;
  raf: any;
  playing: boolean = false;
  
  pointOfView: string;
  pointsOfView: any[];
  viewMode: string;
  viewModes: any[];
  
  resizingDancer: number = 0;
  
  // Musique
  musicElement: any
  musicInfo: any;
  
  constructor(public navCtrl: NavController, public timeHandler: TimeHandlerProvider, public util: UtilProvider) {
    this.pointsOfView = [{ label: 'Extérieur', value: 'external' }];
    this.pointOfView = 'external';
    
    this.viewModes = [{ label: 'Simple écran', value: 'simple'}, { label: 'Double', value: 'dual' }];
    this.viewMode = 'simple';
  }
  
  ngAfterViewInit() {
    // Composant musique
    this.musicElement = this.music.nativeElement;
    this.musicElement.controls = true;
  }

  ionViewDidLoad() {
    this.init();
  }
  
  init() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  
    // Moteur de rendu
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 	  this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
     
    this.containerElement = this.container.nativeElement;
    this.containerElement.appendChild(this.renderer.domElement);

    // Scène
    this.scene = new THREE.Scene();

    // Caméras
    this.camera = new THREE.PerspectiveCamera(90, this.width / this.height, 0.1, 10000);
    this.camera.position.set(0, 600, 600);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    //this.scene.add(this.camera);
    this.dancerCamera = new THREE.PerspectiveCamera(90, this.width / this.height, 0.1, 10000);
    this.dancerCamera.position.set(0, 20, 0);
    this.currentCamera = this.camera;

   	// Contrôles      
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Sol
    let loader = new THREE.TextureLoader();
    loader.load('assets/imgs/floor.jpg',
      texture => {
        this.floorTexture = texture;
      },
      undefined,
      err => {
				console.error('Erreur de chargement de la texture : ' + err);
			}
		);
 
    // Font
    let fontLoader = new THREE.FontLoader();
		fontLoader.load( 'assets/fonts/helvetiker_regular.typeface.json',
      font => {
        this.font = font;
			}
    );
    
    // Lumières
		this.createLights();
    
    // Pour le panneau de texte
    this.createHud();
  }
  
  createLights() {
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
		this.scene.add(ambientLight);
		
		let directionalLight = new THREE.DirectionalLight(0xffffff);
		directionalLight.position.set(-300, 300, 300);
		directionalLight.target.position.set(0, 0, 0);
		directionalLight.castShadow = true;
		directionalLight.shadow.camera.near = 0.1;       
		directionalLight.shadow.camera.far = 1000;      
		directionalLight.shadow.camera.left = -800;
		directionalLight.shadow.camera.bottom = -800;
		directionalLight.shadow.camera.right = 800;
		directionalLight.shadow.camera.top	= 800;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		this.scene.add(directionalLight);
  }
  
  /**
   * Import d'une chorégraphie depuis un fichier texte.
   */
  onFileImportChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];

      reader.readAsDataURL(file);
      reader.onload = () => {
        let choregraphy = JSON.parse(this.b64DecodeUnicode(reader.result.split(',')[1]));
        if (choregraphy.floorWidth != null) {
          this.floorWidth = choregraphy.floorWidth;
        } else {
          this.floorWidth = 1600;
        }
        if (choregraphy.floorHeight != null) {
          this.floorHeight = choregraphy.floorHeight;
        } else {
          this.floorHeight = 800;
        }
        if (choregraphy.backstage != null) {
          this.backstage = choregraphy.backstage;
        }
        /*
        this.dancerWidth = this.floorWidth / 40;
        this.dancerHeight = this.dancerWidth * 2; 
        */
        this.steps = choregraphy.steps;
        this.cleanScene();
        this.createFloorAndPawns(choregraphy.dancers);
        
        this.raf = window.requestAnimationFrame(timestamp => {
          this.animate(timestamp);
        });
      };
    }
  }
  
  b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  }
  
  cleanScene() {
    this.pointsOfView = [{ label: 'Extérieur', value: 'external' }];
    this.pointOfView = 'external';
    
    if (this.meshFloor != null) {
      this.scene.remove(this.meshFloor);
      this.meshFloor = null;
    }
    if (this.pawns != null && this.pawns.length > 0) {
      for (let pawn of this.pawns) {
        let model = pawn.getModel();
        this.scene.remove(model);
      }
    }
  }
  
  /**
   * Création du sol et des danseurs.
   */
  createFloorAndPawns(dancers) {
    this.floorTexture.wrapS = this.floorTexture.wrapT = THREE.RepeatWrapping; 
    this.floorTexture.repeat.set(10, 10);
    let material = new THREE.MeshPhongMaterial({ map: this.floorTexture });
    this.meshFloor = new THREE.Mesh(new THREE.PlaneGeometry(this.floorWidth, this.floorHeight, 10, 10), material);
    this.meshFloor.receiveShadow = true;
    this.meshFloor.rotation.x = -Math.PI / 2;
    this.scene.add(this.meshFloor);
        
    this.pawns = [];
    for (let dancer of dancers) {
      let pawn = new PawnProvider();
      this.scene.add(pawn.createModel(dancer, this.floorWidth, this.floorHeight, this.font));
      this.pawns.push(pawn);
      let label;
      if (dancer.name != null) {
        label = this.util.translate(dancer.color) + ' (' + dancer.name + ')';
      } else {
        label = this.util.translate(dancer.color);
      }
      this.pointsOfView.push({ label: label, value: dancer.color });
      
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  createHud() {
    let hudCanvas = document.createElement('canvas');
    let width = window.innerWidth;
    let height = window.innerHeight;
  
    hudCanvas.width = width;
    hudCanvas.height = height;

    this.ctx = hudCanvas.getContext('2d');
	  this.ctx.font = "Normal 20px Arial";
    //hudBitmap.textAlign = 'center';
    //this.ctx.fillStyle = "rgba(245, 245, 245, 0.75)";
    this.ctx.fillStyle = "white";
    //hudBitmap.fillText('Initializing...', width / 2, height / 2);
    //this.ctx.fillText('Initializing...', 10, 30);
    
    this.hudCamera = new THREE.OrthographicCamera(-this.width / 2, this.width / 2, this.height / 2, -this.height / 2, 0, 30);
    this.hudScene = new THREE.Scene();
     
  	// Create texture from rendered graphics.
	  this.hudTexture = new THREE.Texture(hudCanvas); 
	  this.hudTexture.needsUpdate = true;
  
    // Create HUD material.
    let material = new THREE.MeshBasicMaterial( { map: this.hudTexture } );
    material.transparent = true;

    // Create plane to render the HUD. This plane fill the whole screen.
    let planeGeometry = new THREE.PlaneGeometry(width, height);
    let plane = new THREE.Mesh(planeGeometry, material);
    this.hudScene.add(plane);
  }
  
  getCurrentStep() {
    if (this.currentStepNumber == -1)  {
      return this.backstage;
    }
    return this.steps[this.currentStepNumber];
  }
  
  play() {
    this.playing = true;
    
    // Préparation des danseurs
    if (this.backstage != null)  {
      this.currentStepNumber = -1;
    } else {
      this.currentStepNumber = 0;
      
      // Musique
      if (this.musicInfo != null) {
        this.playMusic();
      }
    }
    for (let pawn of this.pawns) {
      pawn.setStep(this.currentStepNumber);
      pawn.updateSpeed(this.currentStepNumber + 1, this.getCurrentStep().moveDuration * 1000);
    }
    
    // Chrono
    this.timeHandler.initTimer();
    this.timeHandler.initStep();
  }
  
  stop() {
    this.playing = false;
    this.timeHandler.stopTimer();
    if (this.musicInfo != null) {
      this.stopMusic();
    }
    if (this.backstage != null)  {
      this.currentStepNumber = -1;
    } else {
      this.currentStepNumber = 0;
    }
    for (let pawn of this.pawns) {
      pawn.setStep(this.currentStepNumber);
    }
  }
  
  update(timestamp) {
    if (this.playing == true) {
      this.timeHandler.frame(timestamp);
      
      let stepMotionlessDuration = this.getCurrentStep().motionlessDuration * 1000;
      let stepTotalDuration = stepMotionlessDuration + this.getCurrentStep().moveDuration * 1000;
      
      this.ctx.clearRect(0, 0, this.width, this.height);
      if (this.getCurrentStep().note != null) {
        this.ctx.fillText("Note : " + this.getCurrentStep().note, 10, 30);
      } else {
        this.ctx.fillText("Note : ", 10, 30);
      }
      this.ctx.fillText(this.timeHandler.getTimer(), 10, 60);
      this.hudTexture.needsUpdate = true;
      
      if (this.timeHandler.stepCurrentDuration >= stepMotionlessDuration) {
        // On a dépassé la phase sans mouvement de l'étape en cours
        if (this.currentStepNumber >= this.steps.length - 1) {
          // On est à la dernière étape : on s'arrête là
          this.playing = false;
          this.timeHandler.stopTimer();
          if (this.musicInfo != null) {
            this.stopMusic();
          }
        } else {
          // Sinon, on démarre la phase de mouvement
          for (let pawn of this.pawns) {
            pawn.updatePos(this.timeHandler.elapsedTime);
            //pawn.updateDirection(cDirection.DOWN);
            
            // Déplacement de la caméra danseur
            if (this.pointOfView != 'external' && pawn.dancer.color == this.pointOfView) {
              pawn.updateCamera(this.dancerCamera);
            }
          }
          
          // Va-t-on dépasser le temps du step au prochain appel ?
          if (this.timeHandler.stepCurrentDuration + this.timeHandler.elapsedTime > stepTotalDuration) {
            // Oui, on passe au step suivant
            this.currentStepNumber++;
            
            if (this.currentStepNumber < this.steps.length) {
              // Musique
              if (this.currentStepNumber == 0 && this.musicInfo != null) {
                this.playMusic();
              }
              
              // On positionne les danseurs au début du step
              for (let pawn of this.pawns) {
                pawn.setStep(this.currentStepNumber);
                
                // Déplacement de la caméra danseur
                if (this.pointOfView != 'external' && pawn.dancer.color == this.pointOfView) {
                  pawn.updateCamera(this.dancerCamera);
                }
              }
              this.timeHandler.initStep();
              
              // Jusqu'à l'avant-dernière étape, on configure la vitesse pour aller à l'étape suivante
              if (this.currentStepNumber < this.steps.length - 1) {
                for (let pawn of this.pawns) {
                  pawn.updateSpeed(this.currentStepNumber + 1, this.steps[this.currentStepNumber].moveDuration * 1000);
                }
              }
            }
          }
        }       
      }
    }
    if (this.resizingDancer != 0) {
      for (let pawn of this.pawns) {
        pawn.resize(this.resizingDancer);
      }
    }
  }
  
  /**
   * L'utilisateur a changé de point de vue.
   */
  changePointOfView() {
    if (this.pointOfView == 'external') {
      this.currentCamera = this.camera;
    } else {
      this.currentCamera = this.dancerCamera;
      for (let pawn of this.pawns) {
        if (pawn.dancer.color == this.pointOfView) {
          pawn.updateCamera(this.dancerCamera);
        }
      }        
    }
  }
  
  changeViewMode() {
    if (this.viewMode == 'dual') {
      this.camera.aspect = 0.5 * this.width / this.height;
      this.dancerCamera.aspect = 0.5 * this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.dancerCamera.updateProjectionMatrix();
    } else {
      this.camera.aspect = this.width / this.height;
      this.dancerCamera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.dancerCamera.updateProjectionMatrix();
    }
  }
  
  animate(timestamp) {
    this.controls.update();
    this.update(timestamp);
    
    if (this.viewMode == 'dual') {
      /*
      this.renderer.setViewport(0, 0, this.width, this.height);
      this.renderer.clear();
      */
      // Partie gauche
      this.renderer.setViewport(1, 1, 0.5 * this.width - 2, this.height - 2);
      this.renderer.render(this.scene, this.camera);
      this.renderer.render(this.hudScene, this.hudCamera);
      
      // Partie droite
      this.renderer.setViewport(0.5 * this.width + 1, 1, 0.5 * this.width - 2, this.height - 2);
      this.renderer.render( this.scene, this.dancerCamera );	
    } else {
      this.renderer.setViewport(0, 0, this.width, this.height);
      
      //this.renderer.clear();
      this.renderer.render(this.scene, this.currentCamera);
      //this.renderer.clearDepth();
      this.renderer.render(this.hudScene, this.hudCamera);
    }
     
    this.raf = window.requestAnimationFrame(timestamp => {
      this.animate(timestamp);
    });
  }
  
  // ===== Toolbar =====
  
  startResizingDancers(length) {
    this.resizingDancer = length;
  }
  
  stopResizingDancer() {
    this.resizingDancer = 0;
  }
  
  // ===== Musique =====
  
  onMusicFileChange(event) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.musicInfo = { name: file.name, data: reader.result };
        this.musicElement.src = this.musicInfo.data;
      };
    }
  }
  
  playMusic() {
    this.musicElement.currentTime = 0;
    this.musicElement.play();
  }
  
  stopMusic() {
    this.musicElement.pause();
  }
  
  getMusicName() {
    if (this.musicInfo == null) {
      return '';
    }
    if (this.musicInfo.name.length > 20) {
      return this.musicInfo.name.substring(0, 17) + '...';
    }
    return this.musicInfo.name;
  }
}
