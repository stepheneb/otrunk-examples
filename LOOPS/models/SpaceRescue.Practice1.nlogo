breed [stars star]
breed [puffs puff]
breed [shuttles shuttle]
breed [flames flame]
breed [rockets rocket]


rockets-own [x-pos y-pos y-vel mass fuel fire-countdown blasts-remaining r-score shuttle-count ]
; fuel is the amount of fuel remaining. Right now, the fuel is massless. 
; fire-countdown is the number of seconds remaining in one firing cycle. 
; blasts-remaining is the number of blasts remaining to be delivered during the current firing cycle. 
; [x-pos y-pos] is the location of the rocket, even when off-screen. [xcor ycor] is set to [x-pos y-pos] when on-screen
; [x-vel y-vel] is the velocity of the rocket
; r-score is the rocket's current score
; shuttle-count is the current number of shuttles onboard the rocket

shuttles-own [sx-pos sy-pos sx-vel sy-vel time-to-live towed? by-whom value] ; each shuttle has a value, position, velocity, and time to live
; pointers-own [direction] ; Direction can be "h" or "v"
; markers-own [direction] ; Direction can be "h" or "v"
; vel-indicators-own [ID direction] ; Direction can be "h" or "v"
; towed? asks whether the shuttle is being towed by a rocket
; by-whom contains the "who" of the towing rocket. 

globals [t shuttle-mass fuel-remaining x-vel] 
; the following globals that define the motor are defined in the UI
; the user cannot fire a rocket a second time for "fire-duration" seconds. Any fire commands within that time are ignored.
; the total impulse delivered for each command is given by the global "impluse"
; this impulse is delivered as N separate blasts over the "fire-duration" time. Hence, the impulse of each blast is impluse/blasts-per-fire
; the rocket-mass is the mass of the rockets when they are not carrying shuttles. The total mass of each rocket is this plus the mass of its shuttles

; the following set up the system---------------------------------------------

to setup
  clear-all                       ; clears the screen and variables
  setup-globals
  setup-rockets
  setup-flames
  setup-stars                     ; sprinkle some stars at random
  setup-border       ; if the border switch is set, draw a border
  setup-shuttles                  ; place the starting number of free shuttles 
end

To setup-globals
  set t 0                          ; t is the game time in seconds
  set shuttle-mass 50
end
  
to setup-rockets                            ; this version creates one rocket
  create-rockets 1 [ set x-pos (min-pxcor + 5)  set y-pos 0 
    set heading 90 set color red ]    ; set the variables that are unique to the red rocket
  ask rockets [                             ; set the variables that are common to all rockets
    set size 6
    set shape "rocket" 
    set mass 5
    set xcor x-pos set ycor y-pos         ; xcor and ycor are program variables assigned to every object that define where it is placed
    ]
  set fuel-remaining 8
end
    
to setup-flames                               ; these are the flames from the rocket engines
  create-flames 1 [ set color red ]           ; one for the red rocket
  ask flames [                          
    set size 20              ; as the number of blasts per fire increase, the size of the flames decreases
    set shape "flame"
    hide-turtle                               ; hide the flames until needed
    ]
end

to setup-stars ; create a bunch of stars
  create-stars 200 [   
    set size .8 * (1 + random 3) 
    let x ((random 200) + min-pxcor )        ; this selects a location that may be off-screen
    let y ((random 100) + min-pycor )          ; computing the location this way gives fewer stars on a small playspace, but the same density of stars
    ifelse on-screen? x y [
      setxy x y
      set shape "star" 
      set color 85
      set heading random 360]
      [die]   
    ]
end

to setup-border
  ask patches [
    let w 2                                     ; the width of the border
    if pxcor > max-pxcor - w [set pcolor red]
    if pxcor < min-pxcor + w [set pcolor red]
;    if pycor > max-pycor - w [set pcolor red]
;    if pycor < min-pycor + w [set pcolor red]
  ]
end  

to setup-shuttles  ; these are the blue shuttles that are not onboard rockets at the start of the game.
  ; the owned variables are value position, velocity, and time-to-live
  create-shuttles 1 
    [ set sx-pos (max-pxcor - 5)  set sy-pos 0 ]
  ask shuttles [
    set size 8
    set shape "ufo side"
    set color blue
    set xcor sx-pos set ycor sy-pos 
    set towed? false          ; at start, the shuttle is not being towed 
      ]
end


; the following support the user game keys--------------------------------------------

to fire-rockets [head x y]  
  if on-screen? x y [
    ask flames [
      set heading head
      setxy x y
      back 2
      show-turtle  ; turns on the flames. They are turned off in the main "go" loop every .2 sec
      ]
    set fuel-remaining fuel-remaining - 1
   ]
end
; impulse is the total impulse every time the fire button is pressed. 
; a fire command might result in several blasts, as set by the 'blast-per-fire' slider

; begin procedures that control the action-------------------------------------------------------

to go
  every .05 [                                     ; move rockets and shuttles every 50 msec and advance time
    move-rockets
    move-shuttles
    check-explode
    pickup-shuttle                                 ; see whether any rockets can pick up a shuttle
    set t (t + .05) 
    if t >= 40 [beep stop] ]
  every .2 [                                      ; every 2-tenths of a second
    ask rockets with [on-screen? x-pos y-pos]      ; for each rocket on-screen drop a dot marking the rocket's path
      [ hatch-puffs 1 [set color white set size .3 set shape "cloud" ]] ; create a puff at the on-screen rocket
    ask puffs [
      set color (color - .2)                      ; fade all puffs and kill them off when they become black
      if color > 10 [die]]                       ; note: color below 0 becomes very large!
    ask flames [ht]]                                 ; turn off the flames if they happen to be on
end

to move-rockets
  ask rockets [
    set x-pos (x-pos + .05 * x-vel)          ; advance the rocket using its current velocity
    set y-pos (y-pos + .05 * y-vel)
    ifelse on-screen? x-pos y-pos            ; if the rocket is on-screen
      [set xcor x-pos set ycor y-pos st]     ; put the rocket at [x-pos y-pos] and show it
      [ht]]                                  ; otherwise hide the rocket 
end

to move-shuttles
  ask shuttles [
    ifelse towed? 
       [set sx-pos [x-pos] of rocket by-whom  ; if towed, set shuttle at rocket's position
          set sy-pos [y-pos] of rocket by-whom 
          set sx-vel [x-vel] of rocket by-whom ; and velocity to the rocket's velocity
          set sy-vel [y-vel] of rocket by-whom]
       [set sx-pos (sx-pos + .05 * sx-vel)     ; if not towed advance the shuttle using its current velocity
          set sy-pos (sy-pos + .05 * sy-vel)]
    ifelse on-screen? sx-pos sy-pos        ; if the shuttle is on-screen
       [set xcor sx-pos set ycor sy-pos st] ; put the shuttle at [sx-pos sy-pos] and show it
       [ht]                                 ; otherwise hide the shuttle 
    ]
end

to check-explode                         ; if a rocket or shuttle encounters a red patch, explode and die
  ask rockets [if pcolor = red [ explode ]]
  ask shuttles [if pcolor = red [ explode ]]
end
  
to explode
  repeat 15 [
     set shape "explosion1" wait .1
     set shape "explosion2" wait .1
     set size (size + 1)]
   die 
end

to pickup-shuttle ; picks up a shuttle if a rocket is near it and sufficiently near its velocity
  ask rockets [
    let vx x-vel let vy y-vel let m mass let w who
    ask shuttles in-radius 2 [
      if not towed? [
      let closing-speed sqrt ( (vx - sx-vel) ^ 2 + (vy - sy-vel) ^ 2 ) ;
      if closing-speed <= 5 [     ; the rocket can pick up the shuttle
;       set score (score + value)                ; we may want a different scoring algorithm
        set m m + shuttle-mass             ; increase the mass of the rocket
 ;       set shuttle-count shuttle-count + 1      ; increase the number of onboard shuttles
        set color red
        set towed? true  
        set by-whom w]]    ]                              ; the shuttle is now being towed
    set mass m                           
    ]
end
 
; some supporting functions-----------------------------------------------------------

to-report convert-to-x [u]
  ;x is a horizontal position in turtle coordinates
  ;u is a horizontal position in abstract coordinates running from 0 to 100 across the screen
  let a ( max-pxcor - min-pxcor ) / 100 
  let b min-pxcor
  report a * u + b
end

;to-report convert-to-y [v]
  ;y is a horizontal position in turtle coordinates
  ;v is a horizontal position in abstract coordinates running from 0 to 100 across the screen
;  let a ( max-pycor - min-pycor ) / 100 
;  let b min-pycor
;  report a * v + b
;Œend

to-report convert-to-u [x]
  let c 100 / (max-pxcor - min-pxcor)
  let d 100 * min-pxcor / (min-pxcor - max-pxcor)
  report c * x + d
end

; to-report convert-to-v [y]
;  let c 100 / (max-pycor - min-pycor)
;  let d 100 * min-pycor / (min-pycor - max-pycor)
;  report c * y + d
;end

to-report on-screen? [x y]
  if x >= max-pxcor [report false]
  if x <= min-pxcor [report false]
  if y >= max-pycor [report false]
  if y <= min-pycor [report false]
  report true ; this works b/c executing 'report' terminates the subroutine
end
  
@#$#@#$#@
GRAPHICS-WINDOW
215
25
830
161
60
10
5.0
1
10
1
1
1
0
0
0
1
-60
60
-10
10
0
0
1
ticks

BUTTON
15
133
70
167
Left
if fuel-remaining > 0 [\nask rockets with [color = red] \n    [set heading 270\n    set x-vel x-vel - 100  / mass\n    fire-rockets 270 x-pos y-pos ]]
NIL
1
T
OBSERVER
NIL
A
NIL
NIL

TEXTBOX
78
133
128
172
Fire Rocket
14
0.0
1

BUTTON
130
133
185
166
Right
if fuel-remaining > 0 [\n  ask rockets with [color = red] [\n    set heading 90\n    set x-vel x-vel + 100  / mass\n    fire-rockets 90 x-pos y-pos]]
NIL
1
T
OBSERVER
NIL
L
NIL
NIL

BUTTON
12
23
94
61
Setup
setup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
100
23
177
61
Start/stop
go
T
1
T
OBSERVER
NIL
NIL
NIL
NIL

MONITOR
12
67
94
124
Time left
40 - t
1
1
14

MONITOR
101
67
181
124
Fuel Left
Fuel-remaining
17
1
14

@#$#@#$#@
WHAT IS IT?
-----------
This version of Rocket Rescue is designed as a way to get to understand the environment

HOW IT WORKS
------------
This is an accurate simulation of frictionless motion. 

HOW TO USE IT
-------------
The left and right buttons each deliver an impulse to the rocket. Be sure to not enter the red sections at each end. 

THINGS TO NOTICE
----------------
Note that to slow down, you have to turn around and fire. 
Note how much more difficult it is to bring back the shuttle. Why does this happen? 


THINGS TO TRY
-------------
Try to use the rocket to pick up the shuttle and bring it back to the left side. If you stop on the shuttle, you will pick it up. 

EXTENDING THE MODEL
-------------------
You can change the masses of the rocket and shuttle to see what happens. 


RELATED MODELS
--------------
This only the simplest of a series of Rocket Rescue games that introduce key ideas about force and motion. 


CREDITS AND REFERENCES
----------------------
Written by Bob Tinker in June, 2009. Copyright 2009 by the Concord Consortium. This program can be used with attribution for any non-commercial use. 
@#$#@#$#@
default
true
0
Polygon -7500403 true true 150 5 40 250 150 205 260 250

airplane
true
0
Polygon -7500403 true true 150 0 135 15 120 60 120 105 15 165 15 195 120 180 135 240 105 270 120 285 150 270 180 285 210 270 165 240 180 180 285 195 285 165 180 105 180 60 165 15

arrow
true
0
Polygon -7500403 true true 150 0 0 150 105 150 105 293 195 293 195 150 300 150

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

car
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

cloud
false
0
Circle -7500403 true true 13 118 94
Circle -7500403 true true 86 101 127
Circle -7500403 true true 51 51 108
Circle -7500403 true true 118 43 95
Circle -7500403 true true 158 68 134

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

explosion1
true
0
Polygon -1184463 true false 119 117 34 147 116 148 85 256 134 166 227 218 178 158 277 34 158 116 75 9
Polygon -955883 true false 166 13 134 105 15 128 132 128 55 214 143 141 280 179 165 124
Polygon -2674135 true false 11 31 114 117 11 208 136 131 169 284 157 137 293 88 160 109 121 10 121 86

explosion2
true
0
Polygon -1184463 true false 75 30 135 105 255 15 195 135 300 225 150 195 60 285 105 150 75 30
Polygon -2674135 true false 15 105 120 120 135 15 165 120 300 105 180 165 255 270 150 165 105 300 120 150
Polygon -955883 true false 30 45 135 135 30 240 150 165 180 285 165 150 300 165 150 135 165 15 135 105

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

flame
true
0
Polygon -955883 true false 135 150 105 330 150 150 135 150
Polygon -7500403 true true 135 150 150 315 150 150
Polygon -2674135 true false 151 152 181 321 135 150 151 154

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

house
false
0
Rectangle -7500403 true true 45 120 255 285
Rectangle -16777216 true false 120 210 180 285
Polygon -7500403 true true 15 120 150 15 285 120
Line -16777216 false 30 120 270 120

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

person construction
false
0
Rectangle -7500403 true true 123 76 176 95
Polygon -1 true false 105 90 60 195 90 210 115 162 184 163 210 210 240 195 195 90
Polygon -13345367 true false 180 195 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285
Circle -7500403 true true 110 5 80
Line -16777216 false 148 143 150 196
Rectangle -16777216 true false 116 186 182 198
Circle -1 true false 152 143 9
Circle -1 true false 152 166 9
Rectangle -16777216 true false 179 164 183 186
Polygon -955883 true false 180 90 195 90 195 165 195 195 150 195 150 120 180 90
Polygon -955883 true false 120 90 105 90 105 165 105 195 150 195 150 120 120 90
Rectangle -16777216 true false 135 114 150 120
Rectangle -16777216 true false 135 144 150 150
Rectangle -16777216 true false 135 174 150 180
Polygon -955883 true false 105 42 111 16 128 2 149 0 178 6 190 18 192 28 220 29 216 34 201 39 167 35
Polygon -6459832 true false 54 253 54 238 219 73 227 78
Polygon -16777216 true false 15 285 15 255 30 225 45 225 75 255 75 270 45 285

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

rocket
true
0
Polygon -7500403 true true 120 165 75 285 135 255 165 255 225 285 180 165
Polygon -1 true false 135 285 105 135 105 105 120 45 135 15 150 0 165 15 180 45 195 105 195 135 165 285
Rectangle -7500403 true true 147 176 153 288
Polygon -7500403 true true 120 45 180 45 165 15 150 0 135 15
Line -7500403 true 105 105 135 120
Line -7500403 true 135 120 165 120
Line -7500403 true 165 120 195 105
Line -7500403 true 105 135 135 150
Line -7500403 true 135 150 165 150
Line -7500403 true 165 150 195 135
Circle -13840069 true false 135 135 30

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
true
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

ufo side
false
0
Polygon -1 true false 0 150 15 180 60 210 120 225 180 225 240 210 285 180 300 150 300 135 285 120 240 105 195 105 150 105 105 105 60 105 15 120 0 135
Polygon -16777216 false false 105 105 60 105 15 120 0 135 0 150 15 180 60 210 120 225 180 225 240 210 285 180 300 150 300 135 285 120 240 105 210 105
Polygon -7500403 true true 60 131 90 161 135 176 165 176 210 161 240 131 225 101 195 71 150 60 105 71 75 101
Circle -16777216 false false 255 135 30
Circle -16777216 false false 180 180 30
Circle -16777216 false false 90 180 30
Circle -16777216 false false 15 135 30
Circle -7500403 true true 15 135 30
Circle -7500403 true true 90 180 30
Circle -7500403 true true 180 180 30
Circle -7500403 true true 255 135 30
Polygon -16777216 false false 150 59 105 70 75 100 60 130 90 160 135 175 165 175 210 160 240 130 225 100 195 70

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
NetLogo 4.1beta3
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

grid-line
0.0
-0.2 0 0.0 1.0
0.0 1 4.0 4.0
0.2 0 0.0 1.0
link direction
true
0
Line -7500403 true 150 150 90 180
Line -7500403 true 150 150 210 180

@#$#@#$#@
0
@#$#@#$#@
