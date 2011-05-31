;;Tracks - tool for making position vs. time graphs by dragging a mouse

;can be installed into OTrunk and used to create graphs or playback prediction graphs made in OTrunk

;;Global variables for communicating motion data:
;;  x-car1-world and x-car2-world are the positions of the car1 and car2 in world coordinates
;;  t1 and t2 are the corresponding times of each position in seconds
;;  car-number-dragging should be either 1 or 2 depending on which car's position is being updated
;;  set-car-position [ car-num pos-world ] is a procedure with 2 parameters that moves car [car-num], with value either 1 or 2, to location [pos-world] 


breed [tick-positions tick-position]
breed [parks ]
;breed [coffee-shops ]
breed [houses house]
breed [cars car]
breed [forest tree]

extensions [ external-support ]

cars-own [ car-number x-mouse-previous ]

globals [
  init-pos-random?      ;these 4 variables should NOT be initialized in the Setup proceedure
  init-car1-pos         ; they will be initialize externally to NetLogo in the otml (Chico's house = 5)
  init-car2-pos         ;  (Angie's house = -3) (Town Forest = -5)
  define-car2?          ;  Angie to appear or not -- end of variables that should not be initalized in Setup
  min-position  ;;can be interface variables if control is given to use through an input box
  max-position  ;; ditto
  Show-Red
  Show-Blue
  xcor-first       ;;the pixel position of the first tick
  xcor-last        ;;the pixel postion of the last tick
  y-track           ;;height on the screen of the track or road
  mouse-was-up?
  mousex                     ; cumulative motion of the mouse
  mousey
  starting-mousex            ; starting location of the mouse for the current drag
  starting-mousey
  mx
  my
  in-mouse-drag?
  dt                        ;;the time increment, delta t, set as a millisecond
  t1                        ;;this and the next are the global position variables for exporting the car's time out of OTrunk.
  t2
  screen-width              ;;in pixels
  width-of-ticks            ;;number of pixels from the first marked tick to the last
  width-world               ;;width from first to last tick postion in world coorndinates
  num-ticks
  tick-width
  car-number-dragging        ;;indicates which car is being dragged.  0 == no car
  car1-distance 
  car2-distance 
  x-car1-world               ;;this and the next are the global position variables for exporting the cars position out to OTrunk
  x-car2-world
  x-car1-mouse-previous
  x-car2-mouse-previous
  making-a-graph?
]

to startup
  ;setup
end

to init-externals  ;to be called for debugging before the model is authored
   set init-pos-random?  false
   set init-car1-pos 5
   set init-car2-pos -3
   set define-car2? false
end


to setup
  ca  
  init-externals             ;;uncomment for stand-alone testing; set the variables in the procedure
  external-support:external-customization
  set min-position -5
  set max-position 5
  set Show-Red true
  set Show-Blue true
  set y-track -1
  set mouse-was-up? true
  set dt 0.005
  set t1 0
  set t2 0
  set car1-distance 100000
  set car2-distance 200000
  set in-mouse-drag? false
  set car-number-dragging 0    ;;indicates which car is being dragged.  0 == no car
  set making-a-graph? false
  ask patches 
    [ ifelse pycor = y-track 
      [ set pcolor black ]
      [ ifelse (pycor > y-track) [set pcolor sky + 1 ] [set pcolor green ] ] ]
  set-default-shape tick-positions "line"
  set-default-shape parks "flag"
  ;set-default-shape coffee-shops "building shop"
  set-default-shape houses "house bungalow"
  ;set-default-shape cars "dog airedale right"         ;;
  ;;set min-position -10
  ;;set max-position 10
  if min-position >= max-position [
    user-message ("The left end of the track must be less than the right end.")
  ]
  set screen-width world-width     ;was: max-pxcor - min-pxcor
  set num-ticks abs(max-position - min-position) + 1
  set tick-width screen-width / num-ticks
  set width-of-ticks screen-width - tick-width
  set width-world abs(max-position - min-position)
  let i 0
  repeat  num-ticks
  [ create-tick-positions 1 [
      set ycor y-track - 1
      set heading 0
      set size 3
      set color lime - 2
      set label (word (min-position + i))
      set xcor min-pxcor + i * tick-width + tick-width / 2  ;;offset by a half tick width to center it
      if (i = 0) [set xcor-first xcor]
      if (i = num-ticks) [set xcor-last xcor]
      set i i + 1
  ]]
  
 create-parks 1 [
   set xcor x-mouse 0
   set ycor y-track + 3.1
   set size 5
   set color red
   set label "Park"
 ]
 
 create-houses 1 [
  set xcor xcor-first + (10 / 10) * width-of-ticks
  set ycor y-track + 3
  set size 6
  set color yellow
  set label "Chico's" 
 ]
 
  create-houses 1 [
  set xcor xcor-first + (2 / 10) * width-of-ticks
  set ycor y-track + 3
  set size 6
  set color magenta
  set label "Angie's" 
 ]
 
 
 create-cars 1 [                        ;car 1 is Chico, or the BLUE Car
;   set heading 90
   set shape "dog airedale right"
   set ycor y-track + 1
   set size 4
   set car-number 1
   set color orange
   set label-color yellow
   
   ifelse init-pos-random?
     [set xcor x-mouse random-x-world ]
     [set xcor x-mouse init-car1-pos ]
   ;set x-car1-world x-world car-x-pos 1
 ]
 
if define-car2? [
  create-cars 1 [                       ;car 2 is Angie, or the RED Car
   set heading 270
   set shape "dog retriever right"
   set ycor y-track + 1.5
   set size 6
   set car-number 2
   set color brown
   set label-color yellow
   ifelse init-pos-random?
     [set xcor x-mouse random-x-world]
     [set xcor x-mouse init-car2-pos ]
   ;set x-car2-world x-world car-x-pos 2
 ]]
  
     
   create-forest 6 [
     set shape "tree"
     set ycor y-track + 2 + random 2
     set xcor xcor-first - 2 + random 4
     set size 4 + random 2
     set color 52 + random 4
   ]
  
   set x-car1-mouse-previous car-x-pos 1
;   set x-car2-mouse-previous car-x-pos 2
   
   ask cars with [car-number = 1] [set x-mouse-previous x-car1-mouse-previous]
   ask cars with [car-number = 2] [set x-mouse-previous x-car2-mouse-previous]
   
   ask cars with [car-number = 1] [ifelse Show-Blue [st][ht] ]   ;;show or hide the cars based on switch postions
;   ask cars with [car-number = 2] [ifelse Show-Red [st][ht] ]
   
end


to set-initial-positions
  if making-a-graph? [
    set making-a-graph? false
    stop
  ]
  handle-mouse
  every dt [ drag-a-car ]
  
  ask cars with [car-number = 1] [ifelse Show-Blue [st][ht] ]   ;;show or hide the cars based on switch postions
  ask cars with [car-number = 2] [ifelse Show-Red [st][ht] ]  
end

to go
 set making-a-graph? false
 handle-mouse
 every dt [ drag-a-car ]
end

to handle-mouse
     if mouse-down? and mouse-inside? [     
       if mouse-was-up? [                         ; detects a mouse-down event
            set mouse-was-up? false
            set starting-mousex mouse-xcor 
            set starting-mousey mouse-ycor
         ]
         set mx mouse-xcor + mousex - starting-mousex
         set my mouse-ycor + mousey - starting-mousey
         set in-mouse-drag? true
         ]
      if (not mouse-down? and not mouse-was-up?) [   ; detects a mouse-up event
         set mouse-was-up? true 
         set in-mouse-drag? false
         set mousex mx
         set mousey my]
end

to drag-a-car
  ifelse in-mouse-drag? [
    ifelse car-number-dragging = 0 [
      ask cars [
        if car-number = 1 [set car1-distance distancexy starting-mousex starting-mousey]          
        if car-number = 2 [set car2-distance distancexy starting-mousex starting-mousey]  
      ]
      ifelse car1-distance < car2-distance                                                ;;take the smaller distance and ...
        [if car1-distance < 2 [ set car-number-dragging 1 ] ]                             ;;  if it is less than some number (2), set the appropriate car-dragging-number
        [if car2-distance < 2 [ set car-number-dragging 2 ] ] 
    ]
    [ask cars with [car-number = car-number-dragging]                                     ;;if car-number-dragging is either 1 or 2 
      [ set xcor mouse-xcor
        set label precision (x-world xcor) 1
        ifelse car-number-dragging = 1                                                    ;;  then set the car's xcor to the mouse coordinate
          [set x-car1-world x-world car-x-pos 1
            ;;show  xcor - x-car1-mouse-previous                                          ;;debug
            if xcor - x-car1-mouse-previous < 0 and member? "right" shape                 ;;change direction of car so it is always going forward
              [swap-direction-right-to-left]                                              ;;with car image for shape the heading DOES NOT WORK
            if xcor - x-car1-mouse-previous > 0 and member? "left" shape                  ;;instead of changing heading we will change shape
              [swap-direction-left-to-right ]
            set x-car1-mouse-previous xcor            
            set t1 t1 + dt]
          [set x-car2-world x-world car-x-pos 2
            if xcor - x-car2-mouse-previous < 0 and member?  "right" shape
              [swap-direction-right-to-left]
            if xcor - x-car2-mouse-previous > 0 and member?  "left" shape
              [swap-direction-left-to-right]
            set x-car2-mouse-previous xcor                 
            set t2 t2 + dt
            ]
      ]
    ]
    tick    
  ]
  
  [ set car-number-dragging 0
    ask cars [
      if car-number = 1 [set car1-distance 100000]
      if car-number = 2 [set car2-distance 200000]
    ]   
  ]                                              ;; else if NOT in-mouse-drag?, set car-number-dragging back to 0
end


;;gives the mouse x position of the car-number input, 1 or 2
to-report car-x-pos [car-num]
    let x 11
    ask cars [
      if car-number = car-num [set x xcor ]
    ] 
    report x
end

to-report x-world [ x-mouse-cor ]   ;;convert-mouse-xcor-to-world
  let left-edge min-position - 0.5   ;;all this stuff could be moved to globals and only computed on Setup, but it makes too many globals
  let right-edge max-position + 0.5
  let numerator right-edge - left-edge
  let denominator max-pxcor - min-pxcor
  let slope numerator / denominator
  let intercept  left-edge - slope * min-pxcor
  report ( x-mouse-cor * slope ) + intercept
end 

to-report x-mouse [ x-world-cor ]   ;;convert-world-xcor-to-mouse space
  let left-edge min-position - 0.5
  let right-edge max-position + 0.5
  let numerator right-edge - left-edge
  let denominator max-pxcor - min-pxcor
  let slope numerator / denominator
  let intercept  left-edge - slope * min-pxcor
  report ( x-world-cor - intercept) / slope
end 

to show-blue-car [state]
  set Show-Blue state
  ask cars with [car-number = 1] [ifelse Show-Blue [st][ht] ]  
end

to show-red-car [state]
  set Show-Red state
  ask cars with [car-number = 2] [ifelse Show-Red [st][ht] ]  
end

to show-car [ car-num show-state? ]   ;a cars procedure
    ifelse show-state? [st][ht]
      ifelse car-num = 1 [set Show-Blue show-state?][set Show-Red show-state?]
end


to set-car-position [ car-num pos-world ]  ;note that pos-world MAY be outside the legal range of the "world"
  let new-mouse-pos 0
  let show-state? (pos-world >= min-position - 0.4) and (pos-world <= max-position + 0.4)  ;test to see if in the legal range
  ask cars [                                                                               ;  there is a little "extra' space (should be 0.5) on each end
    if car-number = car-num [
      set new-mouse-pos x-mouse pos-world
      
      if new-mouse-pos - x-mouse-previous < 0 and member? "right" shape          ;;change direction of car so it is always going forward
              [swap-direction-right-to-left]                                     ;;with car image for shape the heading DOES NOT WORK, for some mysterious reason
      if new-mouse-pos - x-mouse-previous > 0 and member? "left" shape           ;;instead of changing heading we will change shape
              [swap-direction-left-to-right ]
      set x-mouse-previous new-mouse-pos
      
      show-car car-num show-state?
      
      ifelse show-state?                   ;;setting xcor actually changes the postion of the car
        [set xcor new-mouse-pos 
         set label precision (x-world xcor) 1
        ]
        [ifelse pos-world < min-position 
          [ set xcor x-mouse min-position]
          [ set xcor x-mouse max-position]
        ]
      ]
  ]
  tick
end

to set-car-position-mouse [ car-num pos-mouse ]
  ask cars [
    if car-number = car-num [
      set xcor pos-mouse 
    ] ]
end

;;reports a random position that is between the ends of the track
to-report random-x-world
  let range max-position - min-position
  let random-number random-float range
  report random-number - abs(min-position)
end

to swap-direction-right-to-left
  ifelse member?  "airedale" shape
    [set shape "dog airedale left"]
    [set shape "dog retriever left"]
end

to swap-direction-left-to-right
  ifelse member?   "airedale" shape
    [set shape "dog airedale right"]
    [set shape "dog retriever right"]
end

to-report chico-position
  report x-car1-world
end
@#$#@#$#@
GRAPHICS-WINDOW
6
7
586
148
28
5
10.0
1
12
1
1
1
0
0
0
1
-28
28
-5
5
0
0
0
ticks

BUTTON
8
179
78
212
Setup
Setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
90
179
209
212
Walk the Dog
go
T
1
T
OBSERVER
NIL
NIL
NIL
NIL

@#$#@#$#@
WHAT IS IT?
-----------
This section could give a general understanding of what the model is trying to show or explain.


HOW IT WORKS
------------
This section could explain what rules the agents use to create the overall behavior of the model.


HOW TO USE IT
-------------
This section could explain how to use the model, including a description of each of the items in the interface tab.


THINGS TO NOTICE
----------------
This section could give some ideas of things for the user to notice while running the model.


THINGS TO TRY
-------------
This section could give some ideas of things for the user to try to do (move sliders, switches, etc.) with the model.


EXTENDING THE MODEL
-------------------
This section could give some ideas of things to add or change in the procedures tab to make the model more complicated, detailed, accurate, etc.


NETLOGO FEATURES
----------------
This section could point out any especially interesting or unusual features of NetLogo that the model makes use of, particularly in the Procedures tab.  It might also point out places where workarounds were needed because of missing features.


RELATED MODELS
--------------
This section could give the names of models in the NetLogo Models Library or elsewhere which are of related interest.


CREDITS AND REFERENCES
----------------------
This section could contain a reference to the model's URL on the web if it has one, as well as any other necessary credits or references.
@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

airplane
true
0
Polygon -7500403 true true 150 0 135 15 120 60 120 105 15 165 15 195 120 180 135 240 105 270 120 285 150 270 180 285 210 270 165 240 180 180 285 195 285 165 180 105 180 60 165 15

ambulance
false
0
Rectangle -7500403 true true 30 90 210 195
Polygon -7500403 true true 296 190 296 150 259 134 244 104 210 105 210 190
Rectangle -1 true false 195 60 195 105
Polygon -16777216 true false 238 112 252 141 219 141 218 112
Circle -16777216 true false 234 174 42
Circle -16777216 true false 69 174 42
Rectangle -1 true false 288 158 297 173
Rectangle -1184463 true false 289 180 298 172
Rectangle -2674135 true false 29 151 298 158
Line -16777216 false 210 90 210 195
Rectangle -16777216 true false 83 116 128 133
Rectangle -16777216 true false 153 111 176 134
Line -7500403 true 165 105 165 135
Rectangle -7500403 true true 14 186 33 195
Line -13345367 false 45 135 75 120
Line -13345367 false 75 135 45 120
Line -13345367 false 60 112 60 142

arrow
true
0
Polygon -7500403 true true 150 0 0 150 105 150 105 293 195 293 195 150 300 150

bank
false
0
Rectangle -7500403 true true 45 135 270 255
Rectangle -16777216 true false 124 195 187 256
Rectangle -16777216 true false 60 195 105 240
Rectangle -16777216 true false 60 150 105 180
Rectangle -16777216 true false 210 150 255 180
Line -16777216 false 270 135 270 255
Polygon -7500403 true true 30 135 285 135 240 90 75 90
Line -16777216 false 30 135 285 135
Line -16777216 false 255 105 285 135
Line -7500403 true 154 195 154 255
Rectangle -16777216 true false 210 195 255 240
Rectangle -16777216 true false 135 150 180 180

box
false
0
Polygon -7500403 true true 150 285 285 225 285 75 150 135
Polygon -7500403 true true 150 135 15 75 150 15 285 75
Polygon -7500403 true true 15 75 15 225 150 285 150 135
Line -16777216 false 150 285 150 135
Line -16777216 false 150 135 15 75
Line -16777216 false 150 135 285 75

bug
true
0
Circle -7500403 true true 96 182 108
Circle -7500403 true true 110 127 80
Circle -7500403 true true 110 75 80
Line -7500403 true 150 100 80 30
Line -7500403 true 150 100 220 30

building institution
false
0
Rectangle -7500403 true true 0 60 300 270
Rectangle -16777216 true false 130 196 168 256
Rectangle -16777216 false false 0 255 300 270
Polygon -7500403 true true 0 60 150 15 300 60
Polygon -16777216 false false 0 60 150 15 300 60
Circle -1 true false 135 26 30
Circle -16777216 false false 135 25 30
Rectangle -16777216 false false 0 60 300 75
Rectangle -16777216 false false 218 75 255 90
Rectangle -16777216 false false 218 240 255 255
Rectangle -16777216 false false 224 90 249 240
Rectangle -16777216 false false 45 75 82 90
Rectangle -16777216 false false 45 240 82 255
Rectangle -16777216 false false 51 90 76 240
Rectangle -16777216 false false 90 240 127 255
Rectangle -16777216 false false 90 75 127 90
Rectangle -16777216 false false 96 90 121 240
Rectangle -16777216 false false 179 90 204 240
Rectangle -16777216 false false 173 75 210 90
Rectangle -16777216 false false 173 240 210 255
Rectangle -16777216 false false 269 90 294 240
Rectangle -16777216 false false 263 75 300 90
Rectangle -16777216 false false 263 240 300 255
Rectangle -16777216 false false 0 240 37 255
Rectangle -16777216 false false 6 90 31 240
Rectangle -16777216 false false 0 75 37 90
Line -16777216 false 112 260 184 260
Line -16777216 false 105 265 196 265

building shop
false
0
Rectangle -13840069 true false 15 0 30 195
Rectangle -13840069 true false 15 165 285 255
Rectangle -13345367 true false 120 195 180 255
Line -7500403 true 150 195 150 255
Rectangle -1 true false 30 180 105 240
Rectangle -1 true false 195 180 270 240
Line -16777216 false 0 165 300 165
Polygon -7500403 true true 0 165 45 135 60 90 240 90 255 135 300 165
Rectangle -7500403 true true 0 0 75 45

butterfly
true
0
Polygon -7500403 true true 150 165 209 199 225 225 225 255 195 270 165 255 150 240
Polygon -7500403 true true 150 165 89 198 75 225 75 255 105 270 135 255 150 240
Polygon -7500403 true true 139 148 100 105 55 90 25 90 10 105 10 135 25 180 40 195 85 194 139 163
Polygon -7500403 true true 162 150 200 105 245 90 275 90 290 105 290 135 275 180 260 195 215 195 162 165
Polygon -16777216 true false 150 255 135 225 120 150 135 120 150 105 165 120 180 150 165 225
Circle -16777216 true false 135 90 30
Line -16777216 false 150 105 195 60
Line -16777216 false 150 105 105 60

car left
false
0
Polygon -7500403 true true 0 180 21 164 39 144 60 135 74 132 87 106 97 84 115 63 141 50 165 50 225 60 300 150 300 165 300 225 0 225 0 180
Circle -16777216 true false 30 180 90
Circle -16777216 true false 180 180 90
Polygon -16777216 true false 138 80 168 78 166 135 91 135 106 105 111 96 120 89
Circle -7500403 true true 195 195 58
Circle -7500403 true true 47 195 58

car right
false
0
Polygon -7500403 true true 300 180 279 164 261 144 240 135 226 132 213 106 203 84 185 63 159 50 135 50 75 60 0 150 0 165 0 225 300 225 300 180
Circle -16777216 true false 180 180 90
Circle -16777216 true false 30 180 90
Polygon -16777216 true false 162 80 132 78 134 135 209 135 194 105 189 96 180 89
Circle -7500403 true true 47 195 58
Circle -7500403 true true 195 195 58

circle
false
0
Circle -7500403 true true 0 0 300

circle 2
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240

cow
false
0
Polygon -7500403 true true 200 193 197 249 179 249 177 196 166 187 140 189 93 191 78 179 72 211 49 209 48 181 37 149 25 120 25 89 45 72 103 84 179 75 198 76 252 64 272 81 293 103 285 121 255 121 242 118 224 167
Polygon -7500403 true true 73 210 86 251 62 249 48 208
Polygon -7500403 true true 25 114 16 195 9 204 23 213 25 200 39 123

cylinder
false
0
Circle -7500403 true true 0 0 300

dog airedale left
false
2
Polygon -955883 true true 9 74 21 55 27 39 46 21 69 23 83 45 94 62 107 82 133 87 172 86 216 92 248 106 267 111 278 79 275 51 270 25 277 17 287 36 290 61 291 91 281 116 258 159 248 186 299 230 291 246 273 241 274 229 236 198 228 186 203 180 197 155 203 141 185 154 159 164 120 164 79 145 53 183 40 199 16 217 7 219 6 205 22 193 52 156 61 134 63 102 60 83 46 82 34 98 15 90 7 81 12 74
Polygon -6459832 true false 106 83 109 104 120 114 142 120 182 123 213 120 220 110 229 102 226 98 206 91 171 88 140 87 111 87 103 83
Polygon -16777216 true false 39 44 39 40 47 38 52 42 47 47 41 46 38 44 40 43
Polygon -6459832 true false 49 24 52 36 60 44 70 42 71 34 69 21 60 17 49 20
Polygon -955883 true true 94 154 87 166 74 184 53 203 40 210 35 207 55 187 66 171 71 163 77 151 81 146 93 154
Polygon -955883 true true 199 168 200 184 216 190 228 200 248 220 261 230 259 238 266 239 274 230 259 220 244 206 229 195 225 189 208 183
Polygon -16777216 true false 23 91 25 85 30 77 33 72 31 71 26 78 22 86 19 91 21 93

dog airedale right
false
2
Polygon -955883 true true 291 74 279 55 273 39 254 21 231 23 217 45 206 62 193 82 167 87 128 86 84 92 52 106 33 111 22 79 25 51 30 25 23 17 13 36 10 61 9 91 19 116 42 159 52 186 1 230 9 246 27 241 26 229 64 198 72 186 97 180 103 155 97 141 115 154 141 164 180 164 221 145 247 183 260 199 284 217 293 219 294 205 278 193 248 156 239 134 237 102 240 83 254 82 266 98 285 90 293 81 288 74
Polygon -6459832 true false 194 83 191 104 180 114 158 120 118 123 87 120 80 110 71 102 74 98 94 91 129 88 160 87 189 87 197 83
Polygon -16777216 true false 261 44 261 40 253 38 248 42 253 47 259 46 262 44 260 43
Polygon -6459832 true false 251 24 248 36 240 44 230 42 229 34 231 21 240 17 251 20
Polygon -955883 true true 206 154 213 166 226 184 247 203 260 210 265 207 245 187 234 171 229 163 223 151 219 146 207 154
Polygon -955883 true true 101 168 100 184 84 190 72 200 52 220 39 230 41 238 34 239 26 230 41 220 56 206 71 195 75 189 92 183
Polygon -16777216 true false 277 91 275 85 270 77 267 72 269 71 274 78 278 86 281 91 279 93

dog retriever left
false
0
Polygon -7500403 true true 11 112 31 103 34 95 44 89 50 87 67 90 75 97 81 111 84 116 100 124 131 127 173 130 217 133 227 128 240 119 255 111 273 109 285 109 289 109 286 115 278 116 264 120 255 123 249 129 237 136 229 143 222 143 225 156 225 168 222 176 218 186 217 196 218 207 226 217 224 227 222 238 220 243 204 242 206 233 211 225 206 206 200 191 188 177 170 181 154 183 127 186 101 188 94 217 84 235 68 235 71 225 77 221 82 184 72 175 64 159 64 143 53 128 35 127 22 131 12 126 8 116
Polygon -16777216 true false 37 105 36 105 42 107 45 101 43 99 38 99
Polygon -16777216 false false 45 90 50 99 56 105 63 105 64 98 62 90 56 91 51 91 48 91

dog retriever right
false
0
Polygon -7500403 true true 289 112 269 103 266 95 256 89 250 87 233 90 225 97 219 111 216 116 200 124 169 127 127 130 83 133 73 128 60 119 45 111 27 109 15 109 11 109 14 115 22 116 36 120 45 123 51 129 63 136 71 143 78 143 75 156 75 168 78 176 82 186 83 196 82 207 74 217 76 227 78 238 80 243 96 242 94 233 89 225 94 206 100 191 112 177 130 181 146 183 173 186 199 188 206 217 216 235 232 235 229 225 223 221 218 184 228 175 236 159 236 143 247 128 265 127 278 131 288 126 292 116
Polygon -16777216 true false 263 105 264 105 258 107 255 101 257 99 262 99
Polygon -16777216 false false 255 90 250 99 244 105 237 105 236 98 238 90 244 91 249 91 252 91

dot
false
0
Circle -7500403 true true 90 90 120

face happy
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 255 90 239 62 213 47 191 67 179 90 203 109 218 150 225 192 218 210 203 227 181 251 194 236 217 212 240

face neutral
false
0
Circle -7500403 true true 8 7 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Rectangle -16777216 true false 60 195 240 225

face sad
false
0
Circle -7500403 true true 8 8 285
Circle -16777216 true false 60 75 60
Circle -16777216 true false 180 75 60
Polygon -16777216 true false 150 168 90 184 62 210 47 232 67 244 90 220 109 205 150 198 192 205 210 220 227 242 251 229 236 206 212 183

fish
false
0
Polygon -1 true false 44 131 21 87 15 86 0 120 15 150 0 180 13 214 20 212 45 166
Polygon -1 true false 135 195 119 235 95 218 76 210 46 204 60 165
Polygon -1 true false 75 45 83 77 71 103 86 114 166 78 135 60
Polygon -7500403 true true 30 136 151 77 226 81 280 119 292 146 292 160 287 170 270 195 195 210 151 212 30 166
Circle -16777216 true false 215 106 30

flag
false
0
Rectangle -7500403 true true 60 15 75 300
Polygon -7500403 true true 90 150 270 90 90 30
Line -7500403 true 75 135 90 135
Line -7500403 true 75 45 90 45

flower
false
0
Polygon -10899396 true false 135 120 165 165 180 210 180 240 150 300 165 300 195 240 195 195 165 135
Circle -7500403 true true 85 132 38
Circle -7500403 true true 130 147 38
Circle -7500403 true true 192 85 38
Circle -7500403 true true 85 40 38
Circle -7500403 true true 177 40 38
Circle -7500403 true true 177 132 38
Circle -7500403 true true 70 85 38
Circle -7500403 true true 130 25 38
Circle -7500403 true true 96 51 108
Circle -16777216 true false 113 68 74
Polygon -10899396 true false 189 233 219 188 249 173 279 188 234 218
Polygon -10899396 true false 180 255 150 210 105 210 75 240 135 240

house bungalow
false
0
Rectangle -7500403 true true 210 75 225 255
Rectangle -7500403 true true 90 135 210 255
Rectangle -16777216 true false 165 195 195 255
Line -16777216 false 210 135 210 255
Rectangle -16777216 true false 105 202 135 240
Polygon -7500403 true true 225 150 75 150 150 75
Line -16777216 false 75 150 225 150
Line -16777216 false 195 120 225 150
Polygon -16777216 false false 165 195 150 195 180 165 210 195
Rectangle -16777216 true false 135 105 165 135

leaf
false
0
Polygon -7500403 true true 150 210 135 195 120 210 60 210 30 195 60 180 60 165 15 135 30 120 15 105 40 104 45 90 60 90 90 105 105 120 120 120 105 60 120 60 135 30 150 15 165 30 180 60 195 60 180 120 195 120 210 105 240 90 255 90 263 104 285 105 270 120 285 135 240 165 240 180 270 195 240 210 180 210 165 195
Polygon -7500403 true true 135 195 135 240 120 255 105 255 105 285 135 285 165 240 165 195

line
true
0
Line -7500403 true 150 0 150 300

line half
true
0
Line -7500403 true 150 0 150 150

pentagon
false
0
Polygon -7500403 true true 150 15 15 120 60 285 240 285 285 120

person
false
0
Circle -7500403 true true 110 5 80
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Rectangle -7500403 true true 127 79 172 94
Polygon -7500403 true true 195 90 240 150 225 180 165 105
Polygon -7500403 true true 105 90 60 150 75 180 135 105

plant
false
0
Rectangle -7500403 true true 135 90 165 300
Polygon -7500403 true true 135 255 90 210 45 195 75 255 135 285
Polygon -7500403 true true 165 255 210 210 255 195 225 255 165 285
Polygon -7500403 true true 135 180 90 135 45 120 75 180 135 210
Polygon -7500403 true true 165 180 165 210 225 180 255 120 210 135
Polygon -7500403 true true 135 105 90 60 45 45 75 105 135 135
Polygon -7500403 true true 165 105 165 135 225 105 255 45 210 60
Polygon -7500403 true true 135 90 120 45 150 15 180 45 165 90

police station
false
0
Rectangle -7500403 true true 45 120 255 285
Rectangle -16777216 true false 120 210 180 285
Polygon -7500403 true true 15 120 150 15 285 120
Line -16777216 false 30 120 270 120
Polygon -1184463 true false 148 125 168 152 197 148 172 169 184 202 155 175 126 199 136 168 103 158 139 152 148 126

sheep
false
0
Rectangle -7500403 true true 151 225 180 285
Rectangle -7500403 true true 47 225 75 285
Rectangle -7500403 true true 15 75 210 225
Circle -7500403 true true 135 75 150
Circle -16777216 true false 165 76 116

square
false
0
Rectangle -7500403 true true 30 30 270 270

square 2
false
0
Rectangle -7500403 true true 30 30 270 270
Rectangle -16777216 true false 60 60 240 240

star
false
0
Polygon -7500403 true true 151 1 185 108 298 108 207 175 242 282 151 216 59 282 94 175 3 108 116 108

target
false
0
Circle -7500403 true true 0 0 300
Circle -16777216 true false 30 30 240
Circle -7500403 true true 60 60 180
Circle -16777216 true false 90 90 120
Circle -7500403 true true 120 120 60

tree
false
0
Circle -7500403 true true 118 3 94
Rectangle -6459832 true false 120 195 180 300
Circle -7500403 true true 65 21 108
Circle -7500403 true true 116 41 127
Circle -7500403 true true 45 90 120
Circle -7500403 true true 104 74 152

tree pine
false
0
Rectangle -6459832 true false 120 225 180 300
Polygon -7500403 true true 150 240 240 270 150 135 60 270
Polygon -7500403 true true 150 75 75 210 150 195 225 210
Polygon -7500403 true true 150 7 90 157 150 142 210 157 150 7

triangle
false
0
Polygon -7500403 true true 150 30 15 255 285 255

triangle 2
false
0
Polygon -7500403 true true 150 30 15 255 285 255
Polygon -16777216 true false 151 99 225 223 75 224

truck
false
0
Rectangle -7500403 true true 4 45 195 187
Polygon -7500403 true true 296 193 296 150 259 134 244 104 208 104 207 194
Rectangle -1 true false 195 60 195 105
Polygon -16777216 true false 238 112 252 141 219 141 218 112
Circle -16777216 true false 234 174 42
Rectangle -7500403 true true 181 185 214 194
Circle -16777216 true false 144 174 42
Circle -16777216 true false 24 174 42
Circle -7500403 false true 24 174 42
Circle -7500403 false true 144 174 42
Circle -7500403 false true 234 174 42

turtle
true
0
Polygon -10899396 true false 215 204 240 233 246 254 228 266 215 252 193 210
Polygon -10899396 true false 195 90 225 75 245 75 260 89 269 108 261 124 240 105 225 105 210 105
Polygon -10899396 true false 105 90 75 75 55 75 40 89 31 108 39 124 60 105 75 105 90 105
Polygon -10899396 true false 132 85 134 64 107 51 108 17 150 2 192 18 192 52 169 65 172 87
Polygon -10899396 true false 85 204 60 233 54 254 72 266 85 252 107 210
Polygon -7500403 true true 119 75 179 75 209 101 224 135 220 225 175 261 128 261 81 224 74 135 88 99

wheel
false
0
Circle -7500403 true true 3 3 294
Circle -16777216 true false 30 30 240
Line -7500403 true 150 285 150 15
Line -7500403 true 15 150 285 150
Circle -7500403 true true 120 120 60
Line -7500403 true 216 40 79 269
Line -7500403 true 40 84 269 221
Line -7500403 true 40 216 269 79
Line -7500403 true 84 40 221 269

x
false
0
Polygon -7500403 true true 270 75 225 30 30 225 75 270
Polygon -7500403 true true 30 75 75 30 270 225 225 270

@#$#@#$#@
NetLogo 4.1.2
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
@#$#@#$#@
default
0.0
-0.2 0 1.0 0.0
0.0 1 1.0 0.0
0.2 0 1.0 0.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180

@#$#@#$#@
0
@#$#@#$#@
