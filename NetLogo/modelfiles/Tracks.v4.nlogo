;;Tracks - tool for making position vs. time graphs by dragging a mouse

;can be installed into OTrunk and used to create graphs or playback prediction graphs made in OTrunk

;;Global variables for communicating motion data:
;;  x-car1-world and x-car2-world are the positions of the car1 and car2 in world coordinates
;;  t1 and t2 are the corresponding times of each position in seconds
;;  car-number-dragging should be either 1 or 2 depending on which car's position is being updated
;;  set-car-position [ car-num pos-world ] is a procedure with 2 parameters that moves car [car-num], with value either 1 or 2, to location [pos-world] 


breed [tick-positions tick-position]
breed [banks ]
breed [police-stations ]
breed [houses house]
breed [cars car]
breed [forest tree]


cars-own [ car-number ]

globals [
  ;;left-track-end  ;;now an interface variable
  ;;right-track-end
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
  screen-width
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
  setup
end


to setup
  ca
  set y-track -1
  set mouse-was-up? true
  set dt 0.001
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
      [ set pcolor lime - 2 ] ]
  set-default-shape tick-positions "line"
  set-default-shape forest "tree pine"
  set-default-shape banks "bank"
  set-default-shape police-stations "police station"
  set-default-shape houses "house bungalow"
  ;; set-default-shape cars "car right"         ;;
  ;;set left-track-end -10
  ;;set right-track-end 10
  if left-track-end >= right-track-end [
    user-message ("The left end of the track must be less than the right end.")
  ]
  set screen-width max-pxcor - min-pxcor
  set num-ticks abs(right-track-end - left-track-end) + 1
  set tick-width screen-width / num-ticks
  let i 0
  repeat  num-ticks
  [ create-tick-positions 1 [
      set ycor y-track - 1
      set heading 0
      set size 3
      set color lime - 2
      set label (word (left-track-end + i))
      set xcor min-pxcor + i * tick-width + tick-width / 2  ;;offset by a half tick width to center it
      set i i + 1
  ]]
  
 create-banks 1 [
   set xcor x-mouse left-track-end
   set ycor y-track + 2
   set size 5
   set color gray
 ]
 
 create-police-stations 1 [
   set xcor x-mouse right-track-end
   set ycor y-track + 2
   set size 4
   set color cyan
 ]
 
 create-houses 1 [
  set xcor x-mouse right-track-end / 2
  set ycor y-track + 2.5
  set size 5
  set color yellow 
 ]
 
 create-cars 1 [
   set heading 90
   set shape "car right"
   set ycor y-track + 1
   set size 3
   set car-number 1
   set color blue
   set-car-position 1 random-x-world   ;;could use "set random-xcor" but this tests the set-car-position function
   set x-car1-world x-world car-x-pos 1
 ]
  create-cars 1 [
   set heading 270
   set shape "car left"
   set ycor y-track + 1.5
   set size 3
   set car-number 2
   set color red
   set-car-position 2 random-x-world
   set x-car2-world x-world car-x-pos 2
 ]
   set x-car1-mouse-previous car-x-pos 1
   set x-car2-mouse-previous car-x-pos 2
   
   create-forest 6 [
     set ycor y-track + 1 + random 3
     set xcor random 4
     set size 4 + random 2
     set color 52 + random 4
   ]
;;  loop [
;;    handle-mouse
;;    drag-a-car
;;    if making-a-graph? [stop]
;;    ]
  ;inspect one-of cars   ;;for good debugging
end

to set-initial-positions
  if making-a-graph? [
    set making-a-graph? false
    stop
  ]
  handle-mouse
  every dt [ drag-a-car ]
end

to go
   set making-a-graph? true
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
        ifelse car-number-dragging = 1                                                    ;;  then set the car's xcor to the mouse coordinate
          [set x-car1-world x-world car-x-pos 1
            ;;show  xcor - x-car1-mouse-previous                                          ;;debug
            if xcor - x-car1-mouse-previous < 0 and shape != "car left"                   ;;change direction of car so it is always going forward
              [set shape "car left"]                                                     ;;with car image for shape the heading DOES NOT WORK, for some mysterious reason
            if xcor - x-car1-mouse-previous > 0 and shape != "car right"                  ;;instead of changing heading we will change shape
              [set shape "car right" ]
            set x-car1-mouse-previous xcor            
;            if making-a-graph?
;            [set-current-plot-pen "car1"
;              plotxy t1 x-car1-world
;              set t1 t1 + dt]
            ]
          [set x-car2-world x-world car-x-pos 2
            if xcor - x-car2-mouse-previous < 0 and heading != "car left"
              [set shape "car left"]
            if xcor - x-car2-mouse-previous > 0 and heading != "car right"
              [set shape "car right" ]
            set x-car2-mouse-previous xcor                 
;            if making-a-graph?
;            [set-current-plot-pen "car2"
;              plotxy t2 x-car2-world
;              set t2 t2 + dt]
            ]
      ]
    ]    
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
  let left-edge left-track-end - 0.5   ;;all this stuff could be moved to globals and only computed on Setup, but it makes too many globals
  let right-edge right-track-end + 0.5
  let numerator right-edge - left-edge
  let denominator max-pxcor - min-pxcor
  let slope numerator / denominator
  let intercept  left-edge - slope * min-pxcor
  report ( x-mouse-cor * slope ) + intercept
end 

to-report x-mouse [ x-world-cor ]   ;;concert-world-xcor-to-mouse space
  let left-edge left-track-end - 0.5
  let right-edge right-track-end + 0.5
  let numerator right-edge - left-edge
  let denominator max-pxcor - min-pxcor
  let slope numerator / denominator
  let intercept  left-edge - slope * min-pxcor
  report ( x-world-cor - intercept) / slope
end 


to set-car-position [ car-num pos-world ]
  ask cars [
    if car-number = car-num [
      set xcor x-mouse pos-world]
  ]
end

to set-car-position-mouse [ car-num pos-mouse ]
  ask cars [
    if car-number = car-num [
      set xcor pos-mouse 
    ] ]
end

;;reports a random position that is between the ends of the track
to-report random-x-world
  let range right-track-end - left-track-end
  let random-number random-float range
  report random-number - abs(left-track-end)
end
@#$#@#$#@
GRAPHICS-WINDOW
210
10
1000
245
32
8
12.0
1
12
1
1
1
0
0
0
1
-32
32
-8
8
0
0
1
ticks

BUTTON
17
24
191
57
Reset Cars and Road 
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

INPUTBOX
18
63
93
123
left-track-end
-10
1
0
Number

INPUTBOX
94
63
176
123
right-track-end
10
1
0
Number

MONITOR
24
169
95
222
Red Pos
x-car2-world 
2
1
13

MONITOR
104
169
173
222
Blue Pos
x-car1-world 
2
1
13

BUTTON
20
131
163
164
Set Car Positions
set-initial-positions
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
