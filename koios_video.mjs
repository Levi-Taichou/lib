//console.log(`In ${window.location.href} starting script: ${import.meta.url}`);

 // imports
    import {SetupVideoWindowYouTube,SetVideoTitle} from './koios_playvideo.mjs';
    import {DisplayLessons, SelectLesson,CurrentLesson,LastLesson} from './koios_lessons.mjs';
    import {LinkButton,HideButton,DragItem,publish,subscribe,LinkClickButton,LinkToggleButton} from './koios_util.mjs';
    import {GetSubTitlesAndSheets} from './koios_subtitles.mjs';
    import {currentlang,UpdateTranscript,FoundTranscript,SelectLanguage,SetVideoTranscriptCallbacks} from './koios_showtranscript.mjs';
    import {} from './koios_getslides.mjs';
    import {FoundSlides,PrepareAndLoadSlides,UpdateSlide,SetupSlideWindow,ShowTitles} from './koios_showslides.mjs';
    import {} from './koios_chat.mjs';
    import {} from './koios_notes.mjs';
    import {SetupSliders} from './koios_screenlayout.mjs';
    import {InitSpeak,StopSpeak,StartSpeak,EnableSpeech,IsSpeechOn} from './koios_speech.mjs';
    import {SetupLogWindow} from './koios_log.mjs';
    import {SetupChat} from './koios_chat.mjs';
    import {GetSetupLitAndAssInfo,SetupLitAndAss} from './koios_drive.mjs';
    import {} from './koios_test.mjs';
    import {Relax,InitPopup} from './koios_popup.mjs';
    import {DisplayMessageContinous,SwitchDisplayMessageContinous,DisplayMessage} from './koios_messages.mjs';


export var player=0;
export var currentduration;

{ // Global variables
var currentvideoid;

var position;
var logpos;
var logtext=0;
var logipfs;

var video=0;
var slide;
var ToggleCueVisibilityStatus=true;
var SecondsToSubtitle=[];
var globalyoutubeid; // global for onYouTubeIframeAPIReady
var previous_colour=""
var previous_row=-1;
var table
var tablediv
var fTriedFullScreen=false;
var fFullScreen=false;
var defaultvolume=100;
var vidproginput=0;
var vidprogress=0;
var slider=0; // global
var playerpromise;
var fSoundOn=true;
}    
function GetDuration() {
    if (video) return video.duration;
    if (player && player.getDuration) return  player.getDuration();
    return 0;
}  

var seensec=[];
var seensum;
var seenbucket=[];
var sindex=[];
var maxindex=[];
let buckets=7;

function InitProgress(vidinfo) {
    console.log("InitProgress");
    
    
    buckets=document.getElementsByClassName("progressvalue").length;
    
    seensum=0;
    seenbucket=[]
    seensec=[]
    for (var i=0;i<=buckets;i++)
        seenbucket[i]=0;
    sindex=[]
    var max = vidinfo.duration / buckets;
    var barrier=max;
    var index=0;
    var j=0;
    for (var i=0;i<vidinfo.duration;i++) {
        sindex[i]=index;
        j++;
        if (j > barrier) {
            barrier = barrier -j + max; // next barrier
            maxindex[index]=j;
            j=0;
            index++;            
        }            
    }
    DisplayCurrentVideoProgress()
}    

async function VideoLocation() { 
    var CurrentPos=0;
    var Duration=GetDuration();
    var PlaybackRate=1;
    var ReallyPlayed=0;  
    //console.log(`In VideoLocation pos=${CurrentPos}`);
    
    if (IsVideoPaused())
        return;  // probably just ended, don't update any more
    
    if (player) {
        if (player.getCurrentTime) {
            CurrentPos=player.getCurrentTime();
            PlaybackRate=player.getPlaybackRate()
        }
    }

    UpdateTranscript(CurrentPos);
    UpdateSlide(CurrentPos);
    SetVideoProgressBar(parseFloat (CurrentPos / Duration ));   
    
    var cursec=Math.floor(CurrentPos)
    if (!seensec[cursec]) {
        seensec[cursec]=true;
        seensum++;
        seenbucket[sindex[cursec]]++
        DisplayCurrentVideoProgress()
    }
}  

function DisplayCurrentVideoProgress() {
    
    var children=document.getElementsByClassName("progressvalue");
    
    var str=""
    for (var i=0;i<buckets;i++) { // if larger than buckets, then div/0 errors   
        var perc=parseFloat(seenbucket[i] / maxindex[i] )
        perc = Math.sqrt(perc) * 100
        children[i].style.height=`${perc}%`;
        children[i].style.width=`${perc}%`;
    }
    
   
}    


function SeenVideo() {
    console.log(`Seen video ${currentvideoid}`);
    var  CurrentPos=player.getCurrentTime();
    var cp =  Math.floor(CurrentPos);
    console.log(`In SeenVideo ${cp} ${currentduration} ${sindex[cp]} ${seenbucket[sindex[cp]]}`);
    seenbucket[sindex[cp]] = Math.min(seenbucket[sindex[cp]]+1 , maxindex[sindex[cp]]);
    DisplayCurrentVideoProgress();
}    

subscribe('videoend',    SeenVideo);



async function NextVideo() {
    stopVideo();
    
    await Relax();
    
    if (CurrentLesson == LastLesson) 
        publish ("lessonsend") 
    else      
        SelectLesson(CurrentLesson +1);
}    


async function tcallback() {
    
   // console.log("In tcallback");
    VideoLocation();
   if (!IsVideoPaused())
        setTimeout( tcallback, 400); // 400
}    
/*
function DisplayCurrentFunctionName(args) {
            var ownName = args.callee.toString();
            ownName = ownName.substr('function '.length);        // trim off "function "
            ownName = ownName.substr(0, ownName.indexOf('('));        // trim off everything after the function name
            console.log(`In function ${ownName}`);
           console.log(`In function ${ownName}`);
        }
*/
function SwapObjects(obj1,obj2) {
    var temp = document.createElement("div"); // create marker element     
    console.log('swapping');
    console.log(obj1);
    console.log(obj2);
    obj1.parentNode.insertBefore(temp, obj1); // and insert it where obj1 is   
    obj2.parentNode.insertBefore(obj1, obj2); // move obj1 to right before obj2
    temp.parentNode.insertBefore(obj2, temp); // move obj2 to right before where obj1 used to be    
    temp.parentNode.removeChild(temp); // remove temporary marker node
    // temp should be carbage collected
}    
function swapElements(obj1, obj2) {  // not used now
    var temp = document.createElement("div"); // create marker element     
    var c1 = obj1.childNodes;    
    var c2 = obj2.childNodes;
    while (obj1.childNodes.length > 0) temp.appendChild(obj1.childNodes[0]);
    while (obj2.childNodes.length > 0) obj1.appendChild(obj2.childNodes[0]);
    while (temp.childNodes.length > 0) obj2.appendChild(temp.childNodes[0]);
    
    
}
function CreateButton(name,funct,place) {
    console.log(`CreateButton ${name}`);
    var buttonback=document.createElement("button");
    buttonback.innerHTML = name;
    
    // buttonback.style.float="right";
    
    buttonback.addEventListener("click", funct);
    place.appendChild(buttonback);
}      
function SetFullScreen(fSetFullScreen) {
    console.log(`Making fullscreen ${fSetFullScreen}`);
    let elem = document.body; // let elem = document.documentElement;
    if (fSetFullScreen) {                
        if (elem.requestFullScreen)       console.log("elem.requestFullScreen")  
        if (elem.mozRequestFullScreen)    console.log("elem.mozRequestFullScreen") 
        if (elem.webkitRequestFullScreen) console.log("elem.webkitRequestFullScreen")
        
        if (elem.requestFullScreen) {
            elem.requestFullScreen({ navigationUI: "hide" });
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen({ navigationUI: "hide" });
        } else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen({ navigationUI: "hide" });
        }   
    } else {
        if (document.exitFullscreen)       console.log("document.exitFullscreen")  
        if (document.mozExitFullscreen)    console.log("document.mozExitFullscreen") 
        if (document.webkitExitFullscreen) console.log("document.webkitExitFullscreen")
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozExitFullscreen) {
            document.mozExitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }          
   fFullScreen = fSetFullScreen;
   console.log(`Making fullscreen at end ${fSetFullScreen}`);
}    
function ToggleFullScreen() {
    console.log(`In ToggleFullScreen current value=${fFullScreen}`);
    SetFullScreen(!fFullScreen);
}    

subscribe("shaking",x=>{if (fFullScreen) SetFullScreen(false)});
document.addEventListener("keydown", x=>{publish(`keypressed${x.key}`)}); // connect actions to keypresses, not implemented yet

function GetVolume() {
    if (video) return video.volume;
    if (player && player.getVolume) return player.getVolume();
    return 0;
}    
function SetVolume(newvol) {
    console.log(`In SetVolume newvol=${newvol}`);
    if (video) {
        const newvolint=parseFloat( newvol/ 100);
        video.volume = newvolint;            
    }
    if (player && player.setVolume) player.setVolume(newvol);
    console.log(`New volume=${GetVolume()}`);
}
function CreateSoundSlider() {
    let divsoundslider=document.getElementById("soundslider"); 
    var input=document.createElement("input");
    input.type="range"
    input.min="0"
    input.value=defaultvolume;
    input.max="100"
    input.step="1"
    input.addEventListener("change", obj => SetVolume(obj.target.value))
    divsoundslider.appendChild(input);
    SetVolume(defaultvolume);
}   
function ToggleSound() {
   fSoundOn = !fSoundOn;
   EnableSound(fSoundOn);

    
 //  document.getElementById("audio").style.color=fSoundOn?"red":"white"
}
function EnableSound(fOn) {
    fSoundOn = fOn;// store state
       if (video)
        video.muted= !fOn;
    
    if (player)
        if (fOn) 
            player.unMute(); 
        else 
            player.mute();
    
}   
export async function SetVideoSeconds(seconds) {
    //console.log(`In SetVideoSeconds, moving to ${seconds}`);

    if (player)
        player.seekTo(seconds, true);
    
    
    UpdateTranscript(seconds)
    UpdateSlide(seconds);
    
        //console.log(`New position=${video.currentTime}`);
    //startVideo(); // be sure to start again ==> not starting, to irritating
        
}
async function SetVideoProgressBar(perc) {
    // console.log(`SetVideoProgressBar ${perc}`); 
    if (slider)    
        slider.style.width =  (perc*100)+"%";   

}
export async function CreateVideoSlider() {
    slider=document.getElementById("videodrag").parentElement; 

    function XYUpdate(percx,percy) {
        if (percx >1) percx=1;
        if (percx <=0) percx=0;
        SetVideoProgressBar(percx);
        SetVideoSeconds(parseFloat (GetDuration()*percx ));
    }   
    SetVideoProgressBar(0);
    DragItem("videodrag","videoprogressbar","mainscreen",XYUpdate);
}
function IsVideoPaused(){
    var fpaused=true;
    if (video)  fpaused=video.paused
    if (player && player.getPlayerState) 
        fpaused=( player.getPlayerState() !== 1); // 1 – playing 
    return fpaused;
}
//async function UpdateVideoIndicator(fpaused) { 
//    HideButton("start",!fpaused);
//    HideButton("pause",fpaused);
//}
export async function startVideo() {
   // console.log("In startVideo");
   //         console.log(player.getDebugText());
   //     console.log(player.getVideoData());
    
    
    ShowTitles(false)
    
    
    if (video) {
        video.play();
        video.autoplay=true; // so after location change the video continues to play
    }
    if (player) {  
        if (IsVideoPaused()) // maybe already started via youtube interface
            player.playVideo();
    }
 //   UpdateVideoIndicator(false);

    tcallback(); // callbacks for the progress
}
function TranscriptShownCB(txt) {
    console.log(`In TranscriptShownCB ${txt}`);
      StartSpeak(txt);
}
function stopVideo() {
    console.log("In stopVideo");
    ShowTitles(true);
    if (video) video.pause();
    if (player) player.pauseVideo();
   // UpdateVideoIndicator(true);
    StopSpeak();


}
function TogglePauseVideo() {
    console.log("In TogglePauseVideo");
    var fpaused=IsVideoPaused()
    if (fpaused) {
        if (video)  video.play(); 
        if (player) player.playVideo();
    } else {
        if (video) video.pause();
        if (player)  player.pauseVideo();
    }
    UpdateVideoIndicator(!fpaused);
    StopSpeak();    
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export async function ToggleSpeech(){
    var fspeechon = !IsSpeechOn(); 
    EnableSpeech(fspeechon);
    EnableSound(!fspeechon); // disable video sound when speech is on        
} 
function SetPlayerSubtitle(lang) {
   if (player &&  player.setOption) 
        player.setOption('captions', 'track', lang==""?{}:{'languageCode': lang}); 
}
function CueVisible(lang) { // if lang="" then cue invisible
    if (player)
        SetPlayerSubtitle(lang)
}  
function ToggleCueVisibility() { 
    ToggleCueVisibilityStatus = !ToggleCueVisibilityStatus;
    CueVisible(ToggleCueVisibilityStatus?currentlang:"");
} 

var signs=0;
async function PlayerLoaded() {
    signs++;
    if (signs ==2) 
        publish("playerloaded");
}    


subscribe('videostart',  startVideo);
subscribe('videocued',   PlayerLoaded ); // do nothing, wait for user to start
subscribe('videopause',  stopVideo);
subscribe('videostop',   stopVideo);
subscribe('videoend',    NextVideo);


subscribe('slidesloaded',    PlayerLoaded);


var fVideoRunning=false;

subscribe('popupdisplayblock',x=> { fVideoRunning=!IsVideoPaused();stopVideo();} );
subscribe('popupdisplaynone', x=> { if (fVideoRunning) startVideo(); } ); // if running before, start again


async function LoadVideo(vidinfo) { // call when first video is loaded or a diffent video is selected
    
    console.log(`Loading video ${vidinfo.videoid} ${vidinfo.txt}`);
    console.log(vidinfo);
    player=await playerpromise;
    if (player)
        player.cueVideoById(vidinfo.videoid,0); // start at beginning   
    
    currentduration = vidinfo.duration
    currentvideoid = vidinfo.videoid;
    console.log(`In Loadvideo`);
    SetVideoTitle(vidinfo.txt);
   SetVideoProgressBar(0)
    PrepareAndLoadSlides(vidinfo);
    
    GetSubTitlesAndSheets(vidinfo,FoundTranscript,FoundSlides);
    GetSetupLitAndAssInfo(vidinfo.txt);
    InitProgress(vidinfo);
    
}
async function asyncloaded() {    
    //console.log(`In asyncloaded of script: ${import.meta.url}`);   
    publish("playerstart");
   
    
    var lessonspromise=DisplayLessons(LoadVideo);
    
    playerpromise =SetupVideoWindowYouTube("videoplayer");   
    //LinkButton("start",startVideo);
    
    
   // LinkClickButton("start");subscribe("startclick",startVideo);
    
    LinkToggleButton("start",false);subscribe("starton",startVideo);subscribe("startoff",stopVideo);
    
    
    //LinkButton("stop",stopVideo);    
    //LinkButton("pause",TogglePauseVideo);
   // HideButton("pause",true);
    //LinkButton("audio",ToggleSound);
    
    LinkToggleButton("audio",true);subscribe("audioon",ToggleSound);subscribe("audiooff",ToggleSound);
    
    //LinkButton("speech",ToggleSpeech);    
    LinkToggleButton("speech",false);subscribe("speechon",ToggleSpeech);subscribe("speechoff",ToggleSpeech);
    
    //LinkButton("subtitle",ToggleCueVisibility);     
    LinkToggleButton("subtitle",false);subscribe("subtitleon",ToggleCueVisibility);subscribe("subtitleoff",ToggleCueVisibility);
    
 //   LinkButton("fullscreen",ToggleFullScreen);        
   LinkToggleButton("fullscreen",false);subscribe("fullscreenon",ToggleFullScreen);subscribe("fullscreenoff",ToggleFullScreen);
    
    CreateVideoSlider(); 
    // CreateSoundSlider();
    InitSpeak();
    var chatlink="https://gitter.im/web3examples/test/~embed";    
    //SetupChat("chat",chatlink);
    SetupLitAndAss();
    // CreateButton("closekeyboard",x=>document.blur(),document.getElementById('notes'));
    var metaDom = document.getElementsByName("viewport");
    metaDom[0].content=metaDom[0].content+", user-scalable=no"; //maximum-scale=1.0, minimum-scale=1.0"; // fix zoom    
    var newmeta=document.createElement("meta");
    newmeta.name="viewport";
    newmeta.content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0";   
    SetupSliders();
    //NavigateLessons();   
    
    
    InitPopup();
    player=await playerpromise;    
    SetVideoTranscriptCallbacks(SetVideoSeconds,TranscriptShownCB);
    SelectLanguage("nl");    
    SetupSlideWindow("slideplayer");
    
    console.log("Init ready");
}


publish("playerloading");
SetupLogWindow();
var url = window.location.pathname;
var filename = url.substring(url.lastIndexOf('/')+1);
console.log(filename);
//console.log(`In ${window.location.href} starting script: ${document.currentScript.src}`);
window.addEventListener('DOMContentLoaded', asyncloaded);  // load  
/*  https://gist.github.com/kvyb/3b370c40696ffc222563c8a70276af15
//window.addEventListener('load', (event) => {
//  console.log('page is fully loaded');
   //console.log(Webflow);
//}); */

window.onerror = async function(message, source, lineno, colno, error) {   // especially for ios
console.log("In onerror");
    var str=`Error: ${message} ${source}, ${lineno}, ${colno}  `;
    if (error && error.stack) str = str.concat('\n').concat(error.stack);
    
    //console.log(error.stack);
    
    DisplayMessage(str)
    
} 

