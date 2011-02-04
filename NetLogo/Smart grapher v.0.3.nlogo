; SmartGraph software
; Sept-Nov 2010
; Bob Tinker

; The idea behind these procedures is to engage kids in inventing stories and relating them to graphs.
; There will be intellegent software that analyzes student graphs and respondsd

; The software keeps separate the "problem coordinates" and the "screen coordinates. 
; problem coordinates can be any size and range. They are designated by x and y
; screen coordinates must use screen (or patch) coordinates, designated by u and v
; screen coordinated must fit on the screen defined by (min-xcor, min-ycor) and (max-xcor, max-ycor)
; the software is general enough, so that the screen size can be defined by clicking on the view area and using any reasonable values for the screen size
; the 'stage' is where something can be moved by the user to generate a graph or by the software, animatting a graph
; The user can select any one of several actors to move, thus creating many possible stories.
; the stage can be vertical, horizontal, or absent. 
; I had to create an on-screen button "OK" to stop the repetitive functions. Logo does not support interrupts that provide any way to re-initialize a procedure. 

; With version "X" I have started putting all the data information into the dots that represent data on the graph and eliminated a list of lists of lists I used before. 
; I have also reverted to a earlier approach to naming datasets by their color in a way that makes it trivial to add datasets by adding new colors in the pull-down lists. 

globals [
  grid-params ; see below
  walk-params ; see below
  N-points      ; the number of points in a dataset
  actor-size
  dot-size
  grid-separation
  selected-box  ; the boundary of the selection box

  tag?          ; tells whether a tag or data was selected using the select tool
  stage?        ; tells whether there is a stage
  dot0 dot1 dot2 dot3   ; the turtles that define the select box
  deviation
  dseg          ; the size of the segments used in fitting
  min-seg       ; the fewest number of segments used in fitting
  max-dev       ; the maximum deviation used in fitting 
  dpoints       ; the distance between points in problem coordinates
  token-list
]

breed [drawers drawer]
breed [verticals]
breed [scale-tics]
breed [horizontals]
breed [labels]
breed [actors actor ]          ; these are the things that move. 
breed [dots dot]                 ; dots are the data points that are drawn on the screen
breed [markers]
breed [box-dots box-dot]
breed [tags]    ; A tag is attached to the beginning and ending dots of a selected region. 

actors-own [number location]   ; used to tell #1 and #2 apart and where they are drawn
dots-own [ x-val y-val selected? removed? dot-color]         ; each dot knows its problem coordinates (x-val and y-val) and whether it has been selected or removed.
      ; the dot-color is the usual color of the dot, but the actual color can be different if the dot is not selected. 
tags-own [tag-color tag-x tag-y tag-selected?] ; because selecting a tag changes its color, their invariant color is stored in tag-color. 
      ; The average position in problem coordinates of the data that the tag references
      ; is stored in tag-x and tag-y. This is used for positioning the tag relative to the data. 

; grid-params contains  [ four lists ]
;   s-bounds (screen bounds) contains
;      uMin  the left edge of the grid in screen coordinates
;      uMax  the right edge of the grid
;      vMin  the bottom edge
;      vMax  the top edge
;   p-bounds (problem bounds) contains
;      xMin  the minimum value of x expected (the minimum value on the graph could be less)
;      xMax  the maximum value of x expected
;      yMin  the minimum value of y expected
;      yMax  the maximum value of y expected
;   label-list 
;      xLabel    the label for the x-axis
;      yLabel    the label for the y-axis
;   transforms
;      xm        the screen coordinate u can be computed from the problem value x using
;      xc            u = xm * x + xc
;      ym
;      yc        likewise v = ym * y + yc
;      nxTics    the number of tics along the x-axis
;      nyTics    the number of tics along the y-axis
;      xLow      the starting x-value on the x-axis
;      xHi       the ending x-value on the x-axis
;      yLow      the starting y-value on the y-axis 
;      yHi       the ending y-value on the y-axis

; walk-params contains     [list list value list]
;   s-bounds (screen bounds) contains
;      uMin  the left side of the stage in screen coordinates
;      uMax  the right side of the stage
;      vMin  the bottom of the stage
;      vMax  the top of the stage
;   p-bounds (problem bounds) contains
;      xMin  the minimum value of x expected (the minimum value on the scale could be less)
;      xMax  the maximum value of x expected
;   label    the label below the scale 
;   transforms
;      m        the screen coordinate u can be computed from the problem value x using
;      c            u = m * x + c
;      nxTics    the number of tics along the scale
;      Low      the starting x-value on the scale
;      Hi       the ending x-value on the scale
; Packaging the parameters this way makes it easy to re-configure the screen and add new graphs or stages. 

to startup
    ca                                     ; clear everything
    
    ; initialize globals   
    set N-points 500          ; the number of points in each dataset
    set grid-separation 40    ; the target number of pixels between grid lines
    set actor-size  8         ; controls the size of actors and dot
    set dot-size 2            ; sets the size of each dot
    
    create-box-dots 4 [ht set color violet set size dot-size set shape "dot"] ; used with the selector tool
    set dot0 box-dot 0  
    set dot1 box-dot 1
    set dot2 box-dot 2
    set dot3 box-dot 3
    ask dot1 [                     ; link these into a rectangle. 
       create-link-with dot0
       create-link-with dot2 ]
    ask dot3 [
       create-link-with dot0
       create-link-with dot2 ]  
    set stage? not (stage = "None")    ; stage tells whether there is any stage
    
    create-markers 1 [ht]                  ; use this for general-purpose drawing 

    ; create the two actors that will be moved and animated 
    if stage? [
      create-actors 1 [                                       ; these larger ones move on the 'stage' 
         set size actor-size set number 1
         set location "stage" set shape actor-1 
         set color read-from-string actor-1-color ]    
      create-actors 1 [
        set size actor-size set number 2 
        set location "stage" set shape actor-2  
        set color read-from-string actor-2-color ]]
    create-actors 1 [set size .6 * actor-size set number 1    ; these smaller ones move on the graphs
      set location "grid" set shape actor-1 
      set color read-from-string actor-1-color ]
    create-actors 1 [set size .6 * actor-size set number 2 
      set location "grid" set shape actor-2  
      set color read-from-string actor-2-color ]
    ask actors [set heading 0 ht]

    ; get ready to draw grid by creating grid-params, which contains all the information needed to draw the grid

    let bounds layout         ; the screen boundarys for the screen and stage are set in a separate procedure
    let s-bounds first bounds
    let sw-bounds last bounds
    let p-bounds (list Min-x Max-x Min-y Max-y)             ; all these are globals set by the user with input boxes
    let label-list (list  "time (sec)" "distance (m)")
    set grid-params (list s-bounds p-bounds label-list 0)   ; this creates the grid-params, but with a place-holder for the transforms
          ;  this will not create a grid until "scale-grid" is called to create the actual scale and transforms which are held in the fourth item.                                   
          ;  "draw-view" calls "scale-grid" which completes the information in grid-params
    If stage? [
          ; get ready to draw stage scale by creating walk-params, which contains all the information needed to draw the walk scale
          ; The scale represents the distance the actors walk/drive
      let pw-bounds list Min-y Max-y                    ; these define the default problem range of the walking scale
      let tag-line "distance (m)"
      set walk-params (list sw-bounds pw-bounds tag-line 0)] ; this creates the walk-params, but with a place-holder for the transforms
          ; this is incomplete until scale-stage is called, because it lacks the transforms. "draw-view" calls "scale-stage"

    draw-view ; creates everthing in the view--all graphs and actors, 
    ; once executed, everything needed to draw the view is contained in grid-params and walk-params
    
end

to-report layout  ; uses the global 'stage' and the screen boundaries to locate the screen and stage
  ; three layouts are supported--a vertical stage, a horizontal one, or none. 
  ; data are return as a list of two elements. The first element is s-boundary for the grid and the second is s-boundary for the stage
  let edge 4         ; space allocated around the edges of the grid and stage where there is no scale
  let edge+ 10        ; space needed for scale
  let walk-width 6  ; could be a horizontal or vertical distance
  ; note, button-size is used here, too, but had to be a global b/c it is used elsewhere

  if stage = "Vertical" [
    let uwMin min-pxcor + edge                        ; set screen locations for a vertical stage
    let uwMax uwMin + walk-width
    let uMin uwMax + edge+
    let uMax max-pxcor - edge                   
    let vMin min-pycor + edge+
    let vwMin vMin
    let vMax max-pycor - edge
    let vwMax vMax 
    let s-b (list uMin uMax vMin vMax)
    set  selected-box s-b                          ; default selection box
    let sw-b (list uwMin uwMax vwMin vwMax)
    report list s-b sw-b ]
 
  if stage = "Horizontal" [                ; set screen locations for a horizontal stage                               
    let uMin min-pxcor + edge+                    
    let uwMin umin
    let uMax max-pxcor - edge
    let uwMax max-pxcor - edge 
    let vMin min-pycor + edge+
    let vwMax max-pycor - edge
    let vwMin vwMax - walk-width
    let vMax vwMax - ( edge+ + edge )
    let s-b (list uMin uMax vMin vMax)
    set  selected-box s-b                          ; default selection box
    let sw-b (list uwMin uwMax vwMin vwMax)
    report list s-b sw-b ]
        
 if stage = "None" [       
   let umin min-pxcor + edge+                     ; set screen locations for no stage
   let uMax max-pxcor - edge
   let vMin min-pycor + edge+
   let vMax max-pycor - edge 
   let s-b (list uMin uMax vMin vMax)
   set  selected-box s-b                          ; default selection box
   report list s-b [ ]]
end

to draw-view
  clear-drawing                         ; gets rid of all turtle tracks (will be re-born)....
  ask horizontals [die]                 ;   the grid generators
  ask verticals [die]
  ask scale-tics [die]                  ;    and the tics
  ask dots [ht]                         ; hide all the dots and tags
  ask tags [ht]

  
  scale-grid                            ; update the transformation coefficients for the grid
  draw-grid                             ; draw the grid
  if stage? [
    scale-stage                          ; update the transformation coefficients for the walk scale
    draw-stage                          ; draw the walk scale
    place-actors]       
  ask dots [setuv]                      ; put the data on the new grid
  ask tags [show-tag]

  wait .2 ; needed b/c Logo seems to move the turtles in a separate thread that doesn't finish in time. 
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;  Some Smarts ;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

; linear-match draws a bunch of straight lines that fit any graph. Only selected and not removed data are used
; this is a key building block for smart graphs, since it permits the software to find straight line segments
; and their slopes and match them with what is expected. 
; linear-match calls match-domain which finds the best fit in a given domain. 
; 'best' in this case is the longest one with a mean standard deviation less than the maximum allowed
; match-domain then calls itself to find the best fit to the left and right of the fit it already found
; this recursive call terminates when the domains are too small
; the net effect of match-domain is to generate 'tokens' that reside in token-list
; each token specifies one best fit straight line and its domain with a dev less than the maximum allowed
; all linear-match has to do is to generate dots from the tokens and then show these dots using update-view
; linear-match calls graph-token which actually sets the dots of the fits
; match-domain calls fit-domain which repeatedly generates a best fit and dev for various domains provided by match-domain
; the one with the smallest dev is reported out from fit-domain as a list consisting of N, dev, m, c


to linear-match        ; matches any graph (denoted by graph-color) with a series of straight lines
    let n-segs 40      ; divide the domain into n-search segments (there will be N*(N-1)/2 fits, so don't go too large!!)
    set min-seg 2      ; the shortest number of segments that are fit
    let max-dev% fit%     ; the max deviation allowed as a percent of the total vertical range of the function
    set token-list [ ] ; a token provides the data for a quadratic graph; this will be a list of them
    ; a token consists of x0 x1 (the range graphed) a b c (the coefs of the quadratic) 
    ; for the time being, the 'a' term in the quadratic is always zero, but a quadratic version of fit-domain could be accomodated easily
    
    ; compute the range and domain of the graph being analyzed
    let cnum read-from-string graph-color
    let xMax [x-val] of max-one-of dots with [ color = cnum ] [x-val]
    let xMin [x-val] of min-one-of dots with [ color = cnum ] [x-val]
    let yMax [y-val] of max-one-of dots with [ color = cnum ] [y-val]
    let yMin [y-val] of min-one-of dots with [ color = cnum ] [y-val]
    
    set cnum read-from-string fit-color    
    set max-dev max-dev% * (yMax - yMin) / 100    ; the max dev permitted in problem units
    set dseg (xMax - xMin ) / n-segs              ; the distance between segments
    set dpoints (xMax - xMin ) / ( N-points - 1 ) ; the distance between dots
    match-domain xMin xMax                        ; call the routine that fills up the token-list
    fit-to-pcf                                    ; fix up the tokens so that they are piece-wise continuous, if possible. 

    ask dots with [dot-color = cnum ] [die]       ; get rid of all dots of the fit color 
    foreach token-list [graph-token ?]            ; create dots for a graph based on each token
    ask dots with [dot-color = cnum ][ setuv ]    ; show the new graphs
end

to match-domain [x0 x1]                           ; generates tokens each of which contains data for one linear function for the segment x0 to x1
  ; This first finds the longest fit with deviation < max-dev in this interval and then calls itself for the spaces before and after this fit. 
  ; The longest fit with deviation below max-dev adds a token to token-list.
  ; A match might fail if 1) N<4 for this interval 2) the interval is too short (x1-x0)<min-seg*dseg  (min-seg is the minimum segmet length
  ; considered and dseg is the length in problem coordinates of one segment) or 3) no interval has a deviation less than max-dev. 
  ; In any of those cases, the program exits without calling itself again.
  let longest-domain 0                             ; stores the longest domain yet found
  let longest-m 0                                  ; used for storing the m and b values for the fit with the longest domain 
  let longest-c 0
  let longest-x0 0                                 ; used for the start and end of the interval with the longest domain
  let longest-x1 0
  let x-hi 0

  if x0 + min-seg * dseg <= x1 [                   ; if the interval x0-x1 is long enough, do the fit, otherwise exit
    let x-low x0
    while [ x-low <= (x1 - min-seg * dseg) ][      ; step through starting segments, starting at x0 up to x1-min-seg * dseg
      set x-hi x-low + min-seg * dseg              ; dseg is the size of a segment. min-seg is the minimum number used for fit
      while [ x-hi <= x1 ] [                       ; step through endpoints, starting at min-seg*dseg past x-low and going up to and including xMax

        let fit-results fit-domain x-low x-hi      ; fit to data in the interval between x-low and x-hi--store the results in fit-results
        let N first fit-results                    ; fit-compute returns a list consisting of N, dev, m, and c for this fit
        let dev item 1 fit-results
        if N > 3 and dev < max-dev [               ; this latest fit is acceptable (Note, fit-domain returns N=0 if no fit is made)
          let current-domain x-hi - x-low 
          if current-domain > longest-domain [     ; if the current one is longer than any so far...
            set longest-domain current-domain      ;     save its length and fit data
            set longest-m item 2 fit-results 
            set longest-c item 3 fit-results 
            set longest-x0 x-low
            set longest-x1 x-hi]]
         set x-hi x-hi + dseg ]                    ; move the x-hi up one segment and repeat the fit
       set x-low x-low + dseg ]                    ; move the x-low up segment and repeat stepping x-hi
     if longest-domain > 0 [                       ; check that an acceptable fit was found. if it was...
                                                   ; now the values for the longest acceptable fit are known
                                                   ; make them into a token and put it in the token-list
                                                   
                                                   ; shorten up the list so that the fit does NOT extend beyond the data.
                                                   ; reduce x-hi--find the largest x less than x-hi
       set x-low longest-x0
       set x-hi longest-x1
       let cnum read-from-string graph-color
       set x-hi [ x-val ] of max-one-of dots with [color = cnum and x-val <= x-hi ] [ x-val ]   
                                                   ; increase x-low--find the smallest x larger than x-low 
       set x-low [ x-val ] of min-one-of dots with [color = cnum and x-val >= x-low ] [ x-val ]
                                                   
       set token-list lput                         ; tack a new token onto token-list
         (list x-low x-hi 0 longest-m longest-c ) 
         token-list                                ; the token shows the interval and coefs in ax^2 + bx + c format, with a=0
                                                   ; Now for the magic of recursion. This point is reached only if an acceptable interval was found
                                                   ; If none was found, the following recursive calls are skipped because all intervals that they might 
                                                   ; check have already been checked. But if one interval was found, there might be other 
                                                   ; shorter interval before or after the one found. As soon as each call has found all these, it exits.
       match-domain x0 x-low                       ; call itself for the space to the left of the winning fit
       match-domain x-hi x1 ]]                     ; call itself for the space to the right of the winning fit
end

to-report fit-domain [x0 x1]                       ; find a best fit for the graph-color data between x0 to x1
                                                   ; returns a list: N, deviation, slope, offset 
  Let Sx 0                ; sum (x)
  let Sy 0                ; sum(y)
  let N 0

  let cnum read-from-string graph-color
  ask dots with [ cnum = dot-color and selected? 
      and not removed?  ] [                        ; compute the averages of x and y using only selected and non-removed data
    if (x-val >= x0 and x-val <= x1) [  
      set N N + 1
      set sx sx + x-val
      set sy sy + y-val]]
  if N < 4  [ report (list N 0 0 0)]               ; not enough data. 'report' terminates this procedure

  let xbar sx / N         ; the average x
  let ybar sy / N         ; the average y
  let Sx2 0               ; sum (x^2)
  let Sxy 0               ; sum (x*y)
  let Sy2 0               ; sum (y^2)

  ask dots with [ cnum = dot-color 
      and selected? and not removed? ] [             ; compute the sums needed in the fit equation  
    if (x-val >= x0 and x-val <= x1) [ 
      let xp x-val - xbar                            ; do the calculations on coordinates at the c-of-m of the x-y values
      let yp y-val - ybar                            ; this simplifies the calculations
      set sx2 sx2 + xp ^ 2
      set sxy sxy + xp * yp
      set sy2 sy2 + yp ^ 2 ]]

  let m sxy / sx2                        ; the slope of the best fit line
  let c ybar - m * xbar                  ; the offset of the best fit line
  let d-sq ( m ^ 2 ) * Sx2 + Sy2 - 2 * m * Sxy  ; this is the sum of the squared deviations
  if d-sq < 0 [report ( list N 0 m c )]  ; sometimes a rounding error gives a small negative number
  let dev sqrt (d-sq / (N - 1) )         ; this is the mean standard deviation
  report ( list N dev m c )
end

to fit-to-pcf          ; pcf stands for piecewise continuous function, consisting of (quadratics later) or linear functions
  ; takes token-list as an input and generates one or more pc functions in pclf-list
  ; this list consists of one or more function specifications each in the form of a list
  ; the function specification list consists of two or more x-y pairs each marking the endpoint of one line segment and the start of the next. 
  ; this function connects the discontinuous straight line segments from match-linear if there is not a big gap between segments
  ; large gaps represent spaces between pcl functions and each one encountered ends one pcl function and starts another. 
  
  ; match-domain tends to return good fits but with discontinuities
  ; this routine adjusts the end of one token and the beginning of the next so that the resulting piecewize linear function is continuous. 
  ; it makes this by changing the end and start points but only if the two adjacent segments leave little or no space between themselves. 

  ; then, for each token except the last, look to see if its x1 is within N% of the total width of the domain of the function being fit
  ; if it is, then solve for the crossing point of the two segments
  ; if this doesn't change the endpoints by more than M%, use this crossing point for x1 of the first and x0 of the second. 
  
  ; compute the range and domain of the graph being analyzed
  let cnum read-from-string graph-color
  let xMax [x-val] of max-one-of dots with [ color = cnum ] [x-val]
  let xMin [x-val] of min-one-of dots with [ color = cnum ] [x-val]
  let yMax [y-val] of max-one-of dots with [ color = cnum ] [y-val]
  let yMin [y-val] of min-one-of dots with [ color = cnum ] [y-val]

  ; first order the tokens by increasing x0 values
  if length token-list = 0 [stop]
  let temp-list [ ]
  let temp-token [ ]
  let n length token-list ; this is the number of segments
  while [ n > 1 ][ ; repeat the following as long as there are two or more segments...
    let index-of-smallest 0  ; find the token with the smallest x0, add it to the end of temp-list and remove it from token-list
    let x0-of-smallest first first token-list  ; x0 is the first element in each list in token-list
    let j 1   ; this will be the index into token-list of the token being tested
    while [j < n] [
      let x0-next first item j token-list
      if  x0-next < x0-of-smallest [
        set index-of-smallest j
        set x0-of-smallest x0-next ]
      set j j + 1 ]
    set temp-token item index-of-smallest token-list      ; at this point, index-of-smallest contains the index of the token with the smallest x0
    set temp-list lput temp-token temp-list  ; tack the new token on the end
    set token-list remove-item index-of-smallest token-list     ; take this out of token-list
    set n n - 1 ]
  set token-list lput first token-list temp-list         ; this is tricky--after all the tests, one token remains in token-list, 
  ; at this point, token-list is ordered
  
  ; Now, look for segments that can be joined to make a piecewize continuous function
  ; First, look for continuous sections with good crossing points. 
  let max-gap% 5             ; the maximum gap in the straight line segments that is closed up, as a percent of the screen width. 
  let max-gap-move% 10        ; the maximum amount the crossing can be permitted from the center of the gap, as a percent of the screen width. 
  let max-gap max-gap% * (xMax - xMin) / 100   ; convert the gap percent of screen width to a gap in problem coordinates
  let max-gap-move max-gap-move% * (xMax - xMin) / 100
  set n length token-list   
  if n < 2 [stop]  ; if there are no tokens, stop; if there is one, that one is 'continuous'
  let i 0
  while [ i < ( n - 1) ] [ ; repeat the following as long as there are two or more segments...
    ; look at the gap between token i and i+1
    let left-token item i token-list  ; note that the domain defined by the token is x0 to x1 and x0 is the first item in the token list; x1 is the seond
    let right-token item (i + 1) token-list
    let left-x item 1 left-token    ; this is the right-hand end of the domain of the left token
    let right-x first right-token   ; the left-hand end of the domain of the right token
    ; the gap in question is the difference between left-x and rigth-x
    let mid-x (left-x + right-x ) / 2     ; the mid-point of the gap
    if ( right-x - left-x ) < max-gap [        ; proceed only if the gap is small enough
      let b item 3 left-token 
      let bprime item 3 right-token  
      let c item 4 left-token
      let cprime item 4 right-token
      if not ( b = bprime ) [
        let x 0 - ( c - cprime ) / ( b - bprime )  ; x is where the two segments cross
        if abs ( x - mid-x ) < max-gap-move [      ; if the x-value found does not require too much change..
          set left-token replace-item 1 left-token x      ; replace the old x1 in the left segment with x 
          set right-token replace-item 0  right-token x   ; replace the old x0 in the right segment with x
          set token-list replace-item i token-list left-token         ; update token-list with these new tokens
          set token-list replace-item (i + 1) token-list right-token ]]]
    set i i + 1 ]
end

to save-code ; this code goes with make-pcf and was designed to take care of segments that are quadratic. 
;      let a item 2 left-token 
;      let aprime item 2 right-token ) 
;      let da a - aprime ; the difference between the a's 
;      let db (item 3 left-token ) - ( item 3 right-token ) ; the difference between the b's 
;      let dc (item 4 left-token ) - ( item 4 right-token ) ; the difference between the c's 
;      ifelse  a = 0 and aprime = 0     ; both tokens represent straight line segments
;        [set x 0 - dc / ( 2 * db ) ]
;        [let des db ^ 2 - 4 * da * dc  ; the descriminant
;          ifelse des > 0 [                 ; if positive definite, there are two roots. Find the nearest to the midpoint of the two segments
;            [ let root sqrt des
;              let x1 0 - ( db + root ) / ( 2 * da )
;              let x2 0 - ( db - root ) / ( 2 * da )
;              ifelse abs (x1 - mid-x) < abs (x2 - mid-x) 
;                [ set x x1 ][set x x2 ]]
;            [ set x 0 - db / ( 2 * da ) ]]]     ; if the descriminant <= 0 this is where the two parabolas are closest
end

to graph-token [token]                    ; creates dots for a graph of the token in color fit-cnum (provided by the calling rountine
  if not empty? token [
    let x0 first token                    ; the dots extend from x0 to x1 in steps of dpoints
    let x1 item 1 token                   ; this routine creates the dots, but doesn't actually show them--that's up to the calling routine
    if x1 >= x0 [                         ; x1 must not be smaller than x0 or else this procedure exits without doing anything
      let a item 2 token
      let b item 3 token
      let c item 4 token
      let cnum read-from-string fit-color
      let x x0
      while [ x <= x1 ][
        create-dots 1 [
          ht                              ; hide them because they do not yet know their screen coordinates. 
          set x-val x                     ; set their problem coordinates
          set y-val x * (a * x + b ) + c
          set dot-color cnum
          set color cnum
          set shape "dot"
          set size dot-size 
          set selected? true
          set removed? false ]
        set x x + dpoints ]                  ; dpoints is a global set by the calling routine--the distance between points on the graph 
  ]]
end

to what-happened?           ; this analyzes a token list for breaks and asks what happened.
  
  
  
  
end
;;; older routines follow

to search-linear      ; searches the current graph for linear sections
  search-first        ; searches for the best fit linear
end

to search-first
  let n-search 10                 ; divide the domain into n-search segments (there will be N*(N-1)/2 fits, so don't go too large!!
  let pb item 1 grid-params
  let xMin first pb
  let xMax item 1 pb
  let ddx (xMax - xMin ) / ( n-search - 1 )

  let smallest-d 1e50             ; used to store the smallest deviation
  let smallest-m 0                ; used for storing the m and b values for the fit with the smallest deviation. 
  let smallest-c 0
  let smallest-x0 0               ; used for the start and end of the interval of the best fit
  let smallest-x1 0

  let x-low xMin
  while [ x-low < xMax ][                       ; step through start points, starting at xMin up to but not including xMax
    let x-hi x-low + ddx
    while [ x-hi <= xMax ] [                    ; step through endpoints, starting one past x-low and going up to and including xMax
      let fit-compute fit x-low x-hi            ; fit to data in the interval between x-low and x-hi
      let N first fit-compute
      if N > 1  [                               ; if there were enough data to make a linear fit...
        let dev ( item 1 fit-compute ) / N      ; this is the deviation per point
        if ( dev < smallest-d ) [               ; if the new deviation is smaller that the smallest so far...
          set smallest-d dev
          set smallest-m item 2 fit-compute 
          set smallest-c item 3 fit-compute 
          set smallest-x0 x-low
          set smallest-x1 x-hi]]
      set x-hi x-hi + ddx ]                     ; move the x-hi up one
    set x-low x-low + ddx ]                     ; move the x-low up one
    draw-line smallest-m smallest-c read-from-string fit-color            ; draw a straight line with slope m and offset b
end

to-report fit [x0 x1]                ; linear fits all the data between x0 and x1 in the graph-color dataset
                                     ; returns a list: enough-data?N, deviation, slope, offset
  let cnum read-from-string graph-color
  
  Let Sx 0                ; sum (x)
  let Sy 0                ; sum(y)
  let N 0

  ask dots with [ cnum = dot-color and selected? ] [           ; compute the averages of x and y
    if (x-val >= x0 and x-val <= x1) [  
      set N N + 1
      set sx sx + x-val
      set sy sy + y-val]]
  if N < 2  [ report (list N 0 0 0)]  ; not enough data

  let xbar sx / N    ; the average x
  let ybar sy / N    ; the average y
  let Sx2 0               ; sum (x^2)
  let Sxy 0               ; sum (x*y)
  let Sy2 0               ; sum (y^2)

  ask dots with [ cnum = dot-color and selected? ] [     ; compute the sums needed in the fit equation  
    if (x-val >= x0 and x-val <= x1) [ 
      let xp x-val - xbar                                  ; do the calculations on coordinates at the c-of-m of the x-y values
      let yp y-val - ybar
      set sx2 sx2 + xp ^ 2
      set sxy sxy + xp * yp
      set sy2 sy2 + yp ^ 2 ]]

  let m sxy / sx2                  ; the slope of the best fit line
  let c ybar - m * xbar            ; the offset of the best fit line
  set deviation  sqrt ((( m ^ 2 ) * Sx2 + Sy2 - 2 * m * Sxy ) / (N - 1))
  report ( list N deviation m c )
end


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;; Supporting actors  ;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to place-actors
  if stage? [
    let pb item 1 walk-params
    let xMin first pb
    let xMax last pb
    ask actors with [number = 1] [set color read-from-string actor-1-color]
    ask actors with [number = 2] [set color read-from-string actor-2-color]
    draw-actor-on-stage 1 xMin  ; place the first actor at beginning of the walking scale
    draw-actor-on-stage 2 xMax ]; place the second actor at the end of the walking scale
end

to draw-actor-on-stage [num x]               ; if there is a stage and the actor (icon) is not "None", places actor num at x on the scale. 
  ; actors can be distinguished using their varialbe 'number', which is 1 for the first, 2 for the second
  ; this routine works for both the vertical and horizontal scale
  
  let s-bounds first walk-params             ; extract the stage boundaries
  let umin first s-bounds
  let umax item 1 s-bounds
  let vmin item 2 s-bounds
  let vmax item 3 s-bounds
  let trans item 3 walk-params               ; extract the transformation coeficients 
  let m first trans
  let c item 1 trans
  let u 0 let v 0                            ; initialize u v
  
  ifelse stage = "Vertical"   
    [ set u  ( umin + umax ) / 2             ; if vertical, center horizontally in the stage
      set v  m * x + c ]                     ; convert x from problem coordinates to vertical screen location
    [ set u m * x + c                        ; if horizontal, convert x from problem coordinates to horizontal screen location
      set v ( vmin + vMax ) / 2 ]            ; center vertically in the stage
  ask actors with [number = num and location = "stage"] 
    [ifelse in-stage? u v                  ; if u, v is in the stage.....
      [setxy u v st ]                        ;    move the actor there and show it
      [ht]]                                  ;    otherwise hide it. 
end

to draw-actor-on-grid [num x y]             ; draws actor (icon) with color cnum on the grid at problem coordinate x, y    
  let trans item 3 grid-params
  let u (first trans) * x + item 1 trans
  let v (item 2 trans) * y + item 3 trans
  ask actors with [ number = num and location = "grid" ] [
       ifelse in-grid? u v    
         [setxy u v st ] 
         [ ht ]
    ]  
end    
 
to move-it [num]                              ; the buttons "move #1" and "move #2" call this passing the number num to indicate which actor is moved
                                              ; the user moves this actor and this movement generates a graph
 if stage? [                                  ; collect data when the mouse is down until the mouse is clicked near the OK or N-points points are generated
    let cNum read-from-string graph-color     ; cNum is the color number used in Logo for the graph-color that the user selected
    ask actors  [
      if number = 1 [set shape actor-1]      ; update the shapes
      if number = 2 [set shape actor-2]
      if number = num [set color cNum ]]      ; the one to be moved needs to match the color of the graph  
    ask dots with [dot-color = cNum] [die]    ; remove old points of this color (The dot's actual color many be different due to being de-selected)
    let p-bounds item 1 grid-params           ; the problem bounds for this graph
    let xMin first p-bounds                   ; this is the starting time
    let xMax item 1 p-bounds                  ; the maximum time
    let trans item 3 walk-params              ; extract the transformation parameters
    let m first trans                         ; these are the horizontal transformation numbers for the walk
    let c item 1 trans 
    let u 0
    while [not mouse-inside?]  [ ]            ; do nothing until the user enters the view
    let t xmin 
    let dt (xmax - xmin) / ( .5 * N-points - 1)     ; collect N-points/2 data points
    while [(t < xmax)] [                      ; as long as t is less than xmax collect data, otherwise save the data collected
      every dt [                              ; dt is a real time in seconds. 
        if not mouse-inside? [stop]           ; abort if the mouse is outside the view
        if mouse-down? and mouse-in-stage? [
          ifelse stage = "Vertical"       ; gets the problem value for the mouse depending on whether the stage is vertical or horizontal
            [set u mouse-ycor][set u mouse-xcor]
          let y (u - c) / m     
          create-dots 1 [
            set dot-color cNum
            set shape "dot"
            set size dot-size
            set selected? true
            set removed? false
            set x-val t
            set y-val y           
            setuv ]                        ; puts the dot on the graph at x-val, y-val
          draw-actor-on-stage num y      ; moves the actor (icon) to the mouse location defined by y (I know, two transformations where none is needed, but NL is fast!)
        set t t + dt ]]]]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;; making and displaying graphs ;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to graph-expression                                   ; graphs the expression once or more depending on the user setting of live-graph
                                                      ; divide the domain into N-points steps and calculate y for each
  let ddx (Max-x - Min-x) / ( N-points - 1 )          ; Max-x and Min-x are globals the user sets that determine the domain
  let colorNumber read-from-string graph-color        ; sets the number of the color that identifies the right set of dots and the data they contain
  ask dots with [dot-color = colorNumber ][die]       ; kill off dots of this color and their data  
  ask tags with [tag-color = colorNumber ][die]       ;    and the tags
  create-dots N-points  [ ht                          ; create N-points dots for the graph but don't show them yet
    set dot-color colorNumber                         ; this duality is needed because the 'select' option can change the actual color shown
    set color dot-color                               ;       but the dots and their data are accessed by their dot-color, which doesn't change
    set selected? true set removed? false
    set size dot-size
    set shape "dot" ]
  carefully [                                         ; carefully traps errors without halting execution. Used here to trap syntax errors in the expression to be graphed         
    let a a-in-expression                           ; connect slider to the variable a, which may be used in the expression
    let b b-in-expression                           ; ditto for b
    let c c-in-expression
    let x Min-x
    ask dots with [dot-color = colorNumber][        ; ask all the correctly colored dots to: 
      set x-val x                                   ;    set their x-val to the current value of x 
      set y-val runresult expression                ;    set their y-val to the value of the expression for this x
      set x x + ddx                                 ;    increment the x for each dot that is processed
      setuv ]                                       ; setuv puts the current dot on the screen at u, v based on the x-val, y-val coordinates 
                                                      ;    and the current transforms and turns it on.
                                                      ; note that the existing N-points dots are simply moved, not erased and re-created. 
      wait .05                                        ; let the user see the new graph @@ check this value--it might be better to be smaller
      ]                                    
  [output-print "Syntax error in the expression."     ; you get here if 'carefully' has detected an error, probably a syntax problem
    output-print "Be sure to put spaces before" 
    output-print "and after operators."] 
end

to sketch-graph
;  ask OKs [st]                                        ; turn on the OK button
  let colorNumber read-from-string graph-color        ; read the graph-color selector and convert to a color number
  ask dots with [dot-color = colorNumber ] [die]      ; get rid of the dots of the currently selected graph-color 
  let s-bounds first grid-params                      ; the usual retrieval of variables needed here
  let uMin first s-bounds
  let uMax item 1 s-bounds

  let trans item 3 grid-params
  let xm first trans
  let xc item 1 trans
  let ym item 2 trans
  let yc item 3 trans
  
  let du (uMax - uMin) / (N-points - 1)               ; divide the grid into N-points vertical lines in screen coordinates
  let u uMin let v 0
  create-dots N-points [ht                            ; create N-points colored dots, give them u-values but hide them           
     set dot-color colorNumber 
     set color dot-color 
     set size dot-size set shape "dot" 
     set selected? true set removed? false
     setxy u v                                        ; assign each dot to one of the vertical positions
     set u u + du ]
  while [not  mouse-inside? ] [ ]                      ; do nothing until the user enters the view after pressing the sketch button
  while [mouse-inside? ][                              ; do  the following until the the mouse leaves the view
    if (mouse-down? and mouse-in-grid?) [              ; collect data while the mouse is down in the view
      set u mouse-xcor
      set v mouse-ycor
      ask dots with [dot-color = colorNumber and 
         abs( u - xcor ) < du / 2]  [                 ; find a dot with u-value nearest the cursor 
            setxy xcor v                                 ; move the selected dot to the cursor position and show it
            st ]]]                                    ; loop back to "while" until the OK button is clicked

  ; convert the u, v locations of the N-points of dots to problem coordinates and kill off unused ones
  ask dots with [color = colorNumber ] [
    ifelse hidden? [ die ] [                          ; it a dot is hidden, it was missed during the sketch
      set x-val ( xcor - xc ) / xm                    ; tell each visible dot its problem coordinates
      set y-val ( ycor - yc ) / ym ]]
;  ask OKs [ht]                                        ; hide the OK button
end

to auto-scale                                         ; looks through all the data and picks p-scales to show all selected data
  let xmax -1e20 let xmin 1e20
  let ymax -1e20 let ymin 1e20
  ask dots [                                            ; find the largest and smallest coordinates of all dots. 
    if x-val > xmax [set xmax x-val]
    if x-val < xmin [set xmin x-val]
    if y-val > ymax [set ymax y-val]
    if y-val < ymin [set ymin y-val]]
  set grid-params replace-item 1 grid-params 
     (list xmin xmax ymin ymax)                       ; update the p-bounds in grid-params with the new range 
  if stage? [set walk-params replace-item 1 walk-params  
     (list ymin ymax)  ]                               ; update the w-bounds in grid-params with the new range 
  draw-view                                           ; use the new parameters to draw the grid and graphs
end

to draw-box [u v u1 v1 ]                              ; draws  a box defined by u, v, u1, v1 using links
   ask box-dots [st]
   ask dot0 [setxy u v]
   ask dot1 [setxy u v1]
   ask dot2 [setxy u1 v1]
   ask dot3 [setxy u1 v]
end

to delete                                             ; deletes the data of color given by graph-color
  let cnum read-from-string graph-color
  ask dots with [dot-color = cnum ][die]
  ask tags with [tag-color = cnum ][die]
end

to undo-erase
  let cnum read-from-string graph-color
  ask dots with [color = cnum ] 
    [set removed? false]
  draw-view
end

to bring-front   ; put the current colored graph on top of others by hatching new dots
  let cnum read-from-string graph-color
  ask dots with [dot-color = cnum ][hatch 1 die]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; interacting with tags and data ;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


; "select" allows the user to select a range of data or a tag for subsequent action.  It also can move a tag. 
; After selecting, the user can zoom to the selected region, tag it, eliminate it, remove the tag or fit it by clicking on the appropriate button
; The dataset selected is the one in the 'graph-color' pull-down menu

to select 
  ; If the user first clicks near a tag, then it is selected and can be moved. 
  ; If the first click is not near a tag, then the software allows the user to select a region of the graph by moving a box.  
  ; the result of this procedure is to manipulate the color of tags and dots and to set "selected?" variable of the graph-color dots
  ;    and the data in the global 'selected-box'. 
  ; The tag? global indicates whether tags or data were selected (by first clicking near a tag, or not)
  ; There is a confusing inconsistency here. Later, I use the 'selected?' dot variable to indicate whether a data dot is selected but 
  ;     I use the difference between color and tag-color to indicate selection for tags (for tags, selected? is equivalent to tag-color = color )

  let cnum read-from-string graph-color             ; get the color number of the data being selected
  ask dots with [dot-color = cnum] [
    set color dot-color - 2                         ; dims all the dots of the selected color--an indication that we are waiting for a selection
    set selected? false ]                           ; de-select all the data of that color
  ask tags  [ set size 4 ]             ; dim all tags, regardless of color (this de-selects them, too, b/c I check whether color = tag-color
  wait .05                                          ; this time is needed to dim all the dots!!!
 
  let trans item 3 grid-params                      ; dig out the transformation coefs
  let xm first trans
  let xc item 1 trans
  let ym item 2 trans
  let yc item 3 trans

  while [not (mouse-down? and mouse-inside?) ] [ ] ; wait for mouse-down on view
  let u-initial mouse-xcor                          ; save initial mouse position
  let v-initial mouse-ycor
  ; if this is near a tag, select that tag
  set tag? false                                    ; tag? is a global that is used elsewhere to act on the selected actor type
  ask tags [                                        ; look for a tag near the cursor
    set size 0
    if ((u-initial - xcor) ^ 2 +
       (v-initial - ycor) ^ 2  < 9)  [              ; we might want to change the cut-off distance
      if tag? = false [                             ; this ensures that only the one tag is selected if two happen to be nearby. 
        set tag? true                               ; this indicates that the user is selecting a tag, not a dot or range of dots. 
        set size 4
        set tag-selected? true
        set color tag-color ]]]                     ; show that this tag is selected--if two are nearby, it selects only the first
  if tag?   [                                       ; if the user clicked near a tag.......
    ask dots [                                     ;    do this section if the user selected a tag
      set color dot-color                          ;    brighten all the dots of the selected color
      set selected? true ]                         ;    select all the data of that color
    while [mouse-down?] [                          ;    now allow the user to move the selected tag
      ask tags with [tag-selected? ] [             ;    ask the selected tag....
        setxy mouse-xcor mouse-ycor                ;      to follow the the cursor while the mouse is down.  
        if not mouse-inside? [die ]]]                ; if the user drags outside the view, kill it
    
      ask tags [set tag-selected? false 
         set size 0]
     ask box-dots [ht setxy 0 0]                       ; the easy way to hide the lines is to put all the turtles on top of one another
     stop]                                          ; end of code supporting the tags
                                                   ; the rest of the code supports dots b/c tag? is false here
   ask tags [set color tag-color 
     set tag-selected? false]                  ; brighten up the tags--tags were not selected. 
   let u-current u-initial
   let v-current v-initial
   while [mouse-down?] [                         ; while mouse-down, draw a box between initial and current position
     set u-current mouse-xcor
     set v-current mouse-ycor
   draw-box u-initial v-initial u-current v-current 
      
     ; now brighten the selected dots 
   let umin u-current let umax u-initial         ; first get the min and max for the box in the right ordrer
   if umin > umax          
     [set umin u-initial set umax u-current ]
   let vmin v-current let vmax v-initial      
   if vmin > vmax
     [set vmin v-initial set vmax v-current ]
     
   set selected-box (list umin umax vmin vmax)   ; this is a global used to draw the box
   ask dots with [ dot-color = cnum ] [          ; just work with dots from the dataset selected
     ifelse ( xcor < umin or xcor > umax         ; check whether this dot is inside the selection box
       or ycor < vmin or ycor > vmax )           ; true if outside the selection box
       [ set color dot-color - 2 
         set selected? false ]                   ; dim the dot if the logical expression is true = this dot is outside
       [ set color dot-color 
         set selected? true ]                    ; make the dot full intensity
     ]]                                            ; end of 'ask dots' and 'while mousedown'
     ask box-dots [ht setxy 0 0]                       ; the easy way to hide the lines is to put all the turtles on top of one another
end

to zoom
  ; in a later version, we may want to examine tag? and zoom into the tagged data if a tag was selected...
  ; this version just zooms into selected dots. 
  let trans item 3 grid-params                       ; dig out the transformation coefs
  let xm first trans
  let xc item 1 trans
  let ym item 2 trans
  let yc item 3 trans
  
  let cnum read-from-string graph-color
  let xmax -1e20 let xmin 1e20
  let ymax -1e20 let ymin 1e20
  ask dots with [ dot-color = cnum and selected? ] [   ; find the largest and smallest coordinates of selected dots. 
    if x-val > xmax [set xmax x-val]
    if x-val < xmin [set xmin x-val]
    if y-val > ymax [set ymax y-val]
    if y-val < ymin [set ymin y-val]]
  
  ; simply stuff the correct values into the parameter lists and draw the graph
  let p-bounds (list xmin xmax ymin ymax)                      ; put new range and domain into p-bounds of grid-params
  set grid-params replace-item 1 grid-params p-bounds
  let pw-bounds (list ymin ymax)                          ; put new range into p-bounds of walk-params
  if stage? [set walk-params replace-item 1 walk-params pw-bounds]     ; @@@@@@
  draw-view
  ask dots [set color dot-color set selected? true]   ; undo the selection--turn everything back on
  ask tags [set color tag-color set tag-selected? false]
end
      
to make-tag                                          ; creates a tag associated with the selected data 
  let cnum read-from-string graph-color
  let trans item 3 grid-params                       ; dig out the transformation coefs
  let xm first trans
  let xc item 1 trans
  let ym item 2 trans
  let yc item 3 trans
  let s-bounds first grid-params
  let vMin item 2 s-bounds
  let vMax item 3 s-bounds
                                                     ; find the center of the selected data
  let x 0
  let y 0
  let num 0
  ask dots with [ cnum = dot-color and selected? ] [                                   
     set num num + 1
     set x x + x-val
     set y y + y-val ]
  if num = 0 [stop]
  let x-ave x / num                                  ; compute the center of gravity of the selected point
  let y-ave y / num
  let u xm * x-ave + xc                              ; compute the screen location of the average position 
  let v ym * y-ave + yc
  ifelse v > ( vMax + vMin ) / 2                     ; if the points are above the center of the grid....
     [set v v - 10] [set v v + 10]                   ; move v down, otherwise move it up
  create-tags 1 [                                    ; create a tag
    set tag-x x-ave
    set tag-y y-ave 
    setxy u v
    set label tag-text
    set tag-selected? true
    set shape "dashed box"
    set size 4
    set tag-color cnum
    set color cnum                                   ; 
    create-links-with dots with [selected? and dot-color = cnum]]         ; connect the new tag to all selected dots
  ask dots [set color dot-color set selected? false ]  ; deselect the dots, leave the tag selected...
  repeat 3 [output-print ""]
  output-print "Move tag."
  while [not mouse-down?] [ wait .01 ]                        ; wait for mouse down
  while [mouse-down?] [
    ifelse mouse-inside? [
      ask tags with [tag-selected?] [
        setxy mouse-xcor mouse-ycor ]]
    [ask tags with [tag-selected? ][die]]             ; if dragged outside view area, kill it
    ]
  ask tags [set size 0 set tag-selected? false]
  repeat 6 [output-print ""]
end

to erase-selected                                    ; removes the selected tag or data dots
  let cnum read-from-string graph-color              ;     if nothing was selected, remove the entire dataset of graph-color
  ifelse tag?                                        ; if a tag was selected....
    [ ask tags with [cnum = tag-color ] [die]]       ;     find the selected tag and kill it
    [ ask dots with [selected? and dot-color = cnum] [                    ; if data were selected, find the selected dots and... 
       set removed? true                             ;     tell them that they are removed
       set size .5 * dot-size ]]                                  ;     make them tiny (but never fully remove data!!)   
  unselect                                           ; undo the selection--turn everything back on
end

to unselect ; turns on and selects all dots and tags so they are bright (I know, the name sounds backward.)
   let cnum read-from-string graph-color
    ask dots with
     [dot-color = cnum ] [
        set color cnum                          ; now select all the dots -- including ones that were outside the selection
        set selected? true ]                         ; this resets the selection. 
     ask tags [
       set color tag-color ]
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;  Animation Routines ;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to animate-actor-1
  let cnum  read-from-string actor-1-color
  ask actors with [ number = 1 ] [
    set color cnum
    set shape actor-1]
  animate 1 cnum  ; gets the data for the right-colored graph that will be animated
end

to animate-actor-2
  let cnum  read-from-string actor-2-color
  ask actors with [ number = 2 ] [
    set color cnum
    set shape actor-2]
  animate 2 cnum  ; gets the data for the right-colored graph that will be animated
end

to animate [num cnum] ; steps actor num across the grid and stage in real time using cnum data
                      ; in the loop, calculate the x-value and find the next lower and higher datapoints. 
                      ; extrapolate between them
                      ; this is needed to create smooth motion, even with missing data or an expanded scale
   let p-bounds item 1 grid-params
   let xmin first p-bounds
   let xmax item 1 p-bounds
   let xt xmin
   let dxx (xmax - xmin ) / N-points 
   while [xt <= xmax] [
      let yt interpolate xt cnum           ; yt is interpolated between the points nearest to xt
      draw-actor-on-grid num xt yt
      if stage? [draw-actor-on-stage num yt ]
      set xt xt + dxx 
      wait 200  / ( N-points * animation-speed )]          ; delay a bit before repeating, determined by the slider 'animation-speed']
   ask actors with [location = "grid"] [ht]
   if stage? [ask actors with [location = "stage" ] [st]]
end

to animate-both
   let cnum1 read-from-string actor-1-color   ; set their colors, in case they have changed
   let cnum2 read-from-string actor-2-color 
   ask actors with [ number = 1 ] [
     set color cnum1
     set shape actor-1]                       ; set their shapes, in case they have changed
   ask actors with [ number = 2 ] [
     set color cnum2
     set shape actor-2]

   let p-bounds item 1 grid-params
   let xmin first p-bounds
   let xmax item 1 p-bounds
   let xt xmin
   let dxx (xmax - xmin ) / N-points 
   while [xt <= xmax] [
     let yt1 interpolate xt cnum1     ; yt1 is interpolated between the points nearest to xt with color cnum1
     let yt2 interpolate xt cnum2     ; yt2 is interpolated between the points nearest to xt with color cnum2
     draw-actor-on-grid 1 xt yt1
     draw-actor-on-grid 2 xt yt2
     if stage? [
       draw-actor-on-stage 1 yt1
       draw-actor-on-stage 2 yt2 ]
     set xt xt + dxx 
     wait  200  / ( N-points * animation-speed )]         ; delay a bit before repeating, determined by the slider 'animation-speed']
   ask actors with [location = "grid"] [ht]  
   if stage? [ask actors with [location = "stage" ] [st] ]
end

to-report interpolate [x cnum]                ; reports the y value that interpolates between the nearest points along the x-axis of color cnum
  let nearest-x 0 let nearest-y 0          ;    or extrapolates beyond the data, continuing a straight line using the last two data points. 
  let next-nearest-x 0 let next-nearest-y 0
  let nearest-distance 1e50
  let num 0
  ask dots with  [color = cnum ] [         ; search through the dots for the nearest and next-nearest dots along the x-axis
    set num num + 1                        ; keep track of the number of dots of color cnum
    let dist abs (x-val - x )              ; dist is the distance between the x-value of the current dot and x, the input x-value
    if dist < nearest-distance [           ; if this dot is closer than any before it........
      set next-nearest-x nearest-x         ;        call the previously nearest points the next-nearest 
      set next-nearest-y nearest-y
      set nearest-x x-val                  ;        call this point the nearest
      set nearest-y y-val
      set nearest-distance dist ] ]        ;        and save the new shortest distance
  if num = 0 [report 0]                      ; if there are no dots of color cnum, return zero
  if num = 1 [report nearest-y ]             ; if there is only one dot of color cnum, return its y-value
  if next-nearest-x = nearest-x [
    report nearest-y ]                     ; this should never happen, but this line avoids dividing by zero
  ; compute a straight line y(x) through the nearest and next-nearest points and return y(x)
  report nearest-y + (x - nearest-x) * (next-nearest-y - nearest-y) / (next-nearest-x - nearest-x) 
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;  least-squares fit routines  ;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to linear-fit                                        ; fits to dataset data of selected cnum-colored data, creating a new dataset of "fit-color"
  let cnum read-from-string graph-color 

  Let Sx 0                ; sum (x)
  let Sy 0                ; sum(y)
  let N 0

  ask dots with [ cnum = dot-color and selected? ] [           ; compute the averages of x and y
    set N N + 1
    set sx sx + x-val
    set sy sy + y-val]
  if N < 2  [ output-print "Error: no data to fit" stop] 
  
  let xbar sx / N    ; the average x
  let ybar sy / N    ; the average y
  let Sx2 0               ; sum (x^2)
  let Sxy 0               ; sum (x*y)
  let Sy2 0               ; sum (y^2)

  ask dots with [ cnum = dot-color and selected? ] [     ; compute the sums needed in the fit equation  
    let xp x-val - xbar                                  ; do the calculations on coordinates at the c-of-m of the x-y values
    let yp y-val - ybar
    set sx2 sx2 + xp ^ 2
    set sxy sxy + xp * yp
    set sy2 sy2 + yp ^ 2 ]

  let m sxy / sx2                  ; the slope of the best fit line
  let c ybar - m * xbar            ; the offset of the best fit line
  draw-line m c  read-from-string fit-color
  ask dots [set color dot-color set selected? true ] ; select all dots
end

to draw-line [ m c cnum ]                           ; draw a straight line using color cnum
  let p-bounds item 1 grid-params                   ; get the p-bounds
  let xMin first p-bounds                           ; the best fit will fill the screen, computed at N-points between xMin and xMax
  let xMax item 1 p-bounds
  ask dots with [dot-color = cnum] [die]       ; get rid of all dots of the color of the fit graph
  create-dots N-points [ ht
    set shape "dot"
    set size dot-size
    set selected? true
    set removed? false
    set color cnum
    set dot-color cnum ]
  let ddx (xMax - xMin) / (N-points - 1 )          ;  the step size in problem coordinates
  let x xMin
  ask dots with [color = cnum ] [
    set x-val x
    set y-val m * x + c
    set x x + ddx ]
  draw-view 
end

To quadratic-fit 
  let cnum read-from-string graph-color                                  ;  
  let p-bounds item 1 grid-params                 ; get the p-bounds
  let xMin first p-bounds                         ; the best fit will fill the screen, computed at N-Points + 1 points between xMin and xMax
  let xMax item 1 p-bounds

  let Sx 0                ; sum (x)
  let Sx2 0               ; sum (x^2)
  let Sy 0                ; sum (y)
  let Sxy 0               ; sum (x*y)
  let Sx3 0               ; sum (x^3)
  let Sx4 0               ; sum (x^4)
  let Sx2y 0              ; sum ((x^2)*y)
  let N 0
  ask dots with [dot-color = cnum and selected? ] [             ; compute N and the averages
    set N N + 1
    set sx sx + x-val
    set sy sy + y-val ]
  if N < 2 [ output-print "Error: no data to fit" stop]   ; skip the rest 
  let x-bar sx / N
  let y-bar sy / N
  ask dots with [dot-color = cnum and selected? ] [             ; compute all the sums using the deviation from the averages of x and y 
    let xp x-val - x-bar                          ; This particular fit algorithm first calculates the averages xbar and ybar and then fits to
    let yp y-val - y-bar                          ;    xp = x - xbar and yp = y - ybar the calculations are simpler.
    set sx2 sx2 + xp ^ 2             
    set sxy sxy + xp * yp 
    set sx3 sx3 + xp ^ 3
    set sx4 sx4 + xp ^ 4
    set sx2y sx2y + (xp ^ 2) * yp ]

  let t sx4 - ( sx2 ^ 2 ) / N
  let d sx3 ^ 2 - t * sx2

  let a  (sxy * sx3 - sx2y * sx2) / d
  let b (sx3 * sx2y - T * sxy ) / d
  let c 0 - a * sx2 / n

  let fit-cnum read-from-string fit-color          ; read the color of the data to be created
  ask dots with [dot-color = fit-cnum] [die]       ; get rid of any dots of the color of the fit graph
  create-dots N-points [ ht
    set shape "dot"
    set size dot-size
    set selected? true
    set removed? false
    set color fit-cnum
    set dot-color fit-cnum ]
  let ddx (xMax - xMin) / (N-points - 1 )          ; the step size in problem coordinates
  let x xMin
  ask dots with [color = fit-cnum ] [              ; generate x-y values for the quadratic fit
    set x-val x
    let xp x - x-bar
    set y-val xp * ( a * xp + b ) + c + y-bar
    set x x + ddx ]
  ask dots [set color dot-color set selected? true ]
  draw-view 
end

to-report mouse-in-grid? ; reports whether the mouse is in the graphing grid 
  report in-grid? mouse-xcor mouse-ycor
end

to-report mouse-in-stage? ; reports whether the mouse is in the stage
  report in-stage? mouse-xcor mouse-ycor
end

to-report in-grid? [u v]
  let s-bounds first grid-params
  let uMin first s-bounds
  let uMax item 1 s-bounds
  let vMin item 2 s-bounds
  let vMax item 3 s-bounds
  ifelse (u < uMin or u > uMax or v < vMin or v > vMax) 
    [report false ][report true]
end

to-report in-stage? [u v]
  let s-bounds first walk-params             ; extract the stage boundaries
  let umin first s-bounds - 1
  let umax item 1 s-bounds + 1
  let vmin (item 2 s-bounds - 2)             ; the 2 gives the user a bit more room for straying from the center line.  
  let vmax (item 3 s-bounds + 2)
  ifelse (u < uMin or u > uMax or v < vMin or v > vMax) 
    [report false ][report true]
end

to dance-x  ; not actually used....
  repeat 20 [
    ask-concurrent verticals [ pu
      set label-color red
      set heading 90
      fd .5 
      wait .05
      bk 1
      wait .05
      fd .5 ]]
    ask verticals [set label-color white]
end

to setuv  ; in dot context, draws the current dot representing x-val, y-val in the graph defined by grid-params
   ; controls the color, shape, and turns the dot on
   ; It makes little arrowheads pointing in the right direction if (x-val, y-val) is outside the graphing area. 
   ; points are grey if not selected and tiny if removed  
   ; first, unpack the parts of graph-params that are needed
   let sb first grid-params   ; the screen bounds
   let umin first sb
   let umax item 1 sb
   let vmin item 2 sb
   let vmax last sb
   let trans item 3 grid-params
   let mx first trans 
   let cx item 1 trans
   let my item 2 trans
   let cy item 3 trans
   
   let u mx * x-val + cx                        ; the horz screen coordinate of the x-value
   let v my * y-val + cy                        ; the vertical screen coordinate of the y-value
   let done? false                              ; u and v might be off-grid, in which case the dot shows up as an
                                                ;   arrowhead on the edge or corner pointing toward its location
   set shape "dot"                                             
   if u < umin  [                               ; check on the left
      set shape "default"                       ; out of bounds on the left
      set u umin  
      set heading 270
      if v < vmin [set heading 225 set v vmin]  ; off scale on left and bottom
      if v > vmax [set heading 315 set v vmax]  ; off scale on left and top
      set done? true]
   if u > umax [                                ; check on the right
      set shape "default"                       ; out of bounds on the right      
      set u umax  
      set heading 90
      if v < vmin [set heading 135 set v vmin]  ; off scale on right and bottom
      if v > vmax [set heading 45 set v vmax]   ; off scale on right and top
      set done? true]
   if v > vmax and not done? [                  ; off scale on bottom but not left or right (those have been 'done')
      set shape "default"
      set heading 0
      set v vmax
      set done? true]
   if v < vmin and not done? [                  ; off scale on top but not left or right
      set shape "default"
      set heading 180
      set v  vmin]
   setxy u v                                    ; move the turtle to the point u,v
   ifelse selected?                             ; make de-selected dots more grey
     [set color dot-color]
     [set color dot-color - 2 ]
   ifelse removed?                              ; make removed dots tiny
     [set size .5 * dot-size ] [set size dot-size]
   st
end

to show-tag                                    ; the equivalent of setuv for tags but in a tag context
  ; tags need to be near their data but inside the view screen (possibly outside the grid, however)
  ; a tag knows the center (tag-x, tag-y) of the dots to which it is connected, in problem coordinates. 
  ; This routine converts these to screen coordinates and then put the tag above or below the center.
  ; Tags are connected to dots when they are created, so this routine doesn't have to draw the connections. 

  let sb first grid-params   ; the screen bounds
  let umin first sb
  let umax item 1 sb
  let vmin item 2 sb
  let vmax last sb
  let trans item 3 grid-params
  let mx first trans 
  let cx item 1 trans
  let my item 2 trans
  let cy item 3 trans 
  
  let u mx * tag-x + cx
  let v my * tag-y + cy 
  let u-ave (umax + umin) / 2   
  let v-ave (vmax + vmin) / 2 
  ifelse v > v-ave
    [set v v - 10 ]  ; if the center of the data is above the middle of the graph, lower the tag
    [set v v + 10 ]  ;    otherwise raise it
  ifelse u < umin or u > umax or v < vmin or v > vmax 
     [setxy u-ave v-ave]     ; if the calculation would put the tag off-grid, place it in the middle of the grid. 
     [setxy u v  ]       ; place the tag
  st                ; show it
end

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;; scale and grid-drawing routines ;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

to scale-Grid   ; Completes the grid-params by supplying the transform coeficients
  ; the input to this is grid-params but without transform coef
  ; this routine needs grid-params to contain the correct screen-bounds problem-bounds and label list
  ; screen-bounds are uMin  uMax  vMin  vMax which define the graphing window; tic marks and labels are drawn outside this
  ; problem-bounds are xMin xMax yMin yMax
  ; the x, y coordinates are the problem coordinates 
  
  ; For each axis, this program generates the best scale minimum and maxium 
  ;     and the best number of tic marks
  ; From these, it calculates the problem-to-screen transformations which are reported out

  let screen-bounds first grid-params
  let umin first screen-bounds
  let umax item 1 screen-bounds
  let vmin item 2 screen-bounds
  let vmax last screen-bounds
  
  let problem-bounds item 1 grid-params
  let xmin first problem-bounds
  let xmax item 1 problem-bounds
  let ymin item 2  problem-bounds
  let ymax last  problem-bounds
  
  let xTarget ( umax - umin ) * patch-size / grid-separation       ;  sets the target number of tics based on the size of the graphing area
                                                      ;  allocates about grid-separation pixels per tic
  let a ticMarks xMin xMax xTarget                    ; a now contains xlow, xhi, and ntics
  let xLow first a                                    ; unpack a
  let xHi first but-first a
  let xNTics last a    
  set a mcCoef xLow xHi uMin uMax                     ; get the transform pair m, c for u = mx + c
  let xm first a
  let xc last a

  let yTarget ( vmax - vmin ) * patch-size / grid-separation      
  set a ticMarks yMin yMax yTarget                    ; a now contains ylow, yhi, and ntics
  let yLow first a                                    ; unpack a
  let yHi item 1 a
  let yNTics last a
  set a mcCoef yLow yHi vMin vMax                     ; get the transform pair m, c
  let ym first a
  let yc last a
  let trans (list xm xc ym yc xNTics yNTics xLow xHi yLow yHi)
  set grid-params replace-item 3 grid-params trans    ; update grid-params
end
 
to draw-grid                                           ; draws the grid using grid-params
  let ticLength 3     ; the length of the tic marks below the grid
  ; unpack the parameters needed from grid-params
  ; xLow xHi yLow yHi xntics yntics xm xc vmax vmin xlabel

  let screen-bounds first grid-params
  let umin first screen-bounds
  let umax item 1 screen-bounds
  let vmin item 2 screen-bounds
  let vmax last screen-bounds
  
  let problem-bounds item 1 grid-params
  let xmin first problem-bounds
  let xmax item 1 problem-bounds
  let ymin item 2  problem-bounds
  let ymax last  problem-bounds
  
  let ll item 2 grid-params
  
  let coef item 3 grid-params
  let xm first coef        
  let xc item 1 coef
  let ym item 2 coef
  let yc item 3 coef
  let xNTics item 4 coef    ;the number of tics along the x-axis
  let yNTics item 5 coef    ;the number of tics along the y-axis
  let xLow item 6 coef      ;the starting x-value on the x-axis
  let xHi item 7 coef       ;the ending x-value on the x-axis
  let yLow item 8 coef      ;the starting y-value on the y-axis 
  let yHi item 9 coef       ;the ending y-value on the y-axis

  let dxx (xHi - xLow)/(xNtics - 1)                     ;  the distance between x-tics in problem coordinates
  let x xLow
  repeat xNtics [
    create-verticals 1 [                               ; create the vertical lines  by drawing down from the top
      set label precision x 3
      set heading 180                                  ; aim down
        ifelse x = xLow or x = xHi 
          [set color white set pen-size 2 ]            ; for the edges!
          [set color gray set pen-size 1 ]             ; for the inside lines
        setxy (xm * x + xc) vmax 
        ]
     set x x + dxx ]                                     ; at this point turtles are poised to descend from the top of the graph
  ask verticals [ pd fd vmax + ticLength - vmin ]        ; draws all the verticals at once 
  create-labels 1 [
    set label first ll
    setxy .5 * (uMin + uMax) vMin - 5
    set color black ]

  let dyy (yHi - yLow)/(yNtics - 1)                     ;  the distance between y-tics in problem coordinates
  let y yLow
  repeat yNtics [
    create-horizontals 1 [                               ; create the vertical lines  by drawing left from the right
      set label precision y 3
      set heading 270                                  ; aim left
        ifelse y = yLow or y = yHi 
          [set color white set pen-size 2 ]            ; for the edges!
          [set color gray set pen-size 1 ]             ; for the inside lines
        setxy umax (ym * y + yc) 
        ]
     set y y + dyy ]                                     ; at this point turtles are poised to descend from the top of the graph
  ask horizontals [ pd fd umax + ticLength - umin ]        ; draws all the verticals at once 
  create-labels 1 [
    set label last ll
    setxy uMin + 8 vMax + 3
    set color black ]
end

to set-scale
  let pb (list min-x max-x min-y max-y)
  set grid-params replace-item 1 grid-params pb
  if stage? [set walk-params replace-item 1 walk-params  
     (list min-y max-y)]                                ; update the w-bounds in grid-params with the new range 
  draw-view                                           ; use the new parameters to draw the grid and graphs
end

to scale-stage                                          ; completes walk-params to get ready to show walk scale

  let s-bounds first walk-params                       ; unpack needed variables
  let uMin first s-bounds
  let uMax item 1 s-bounds
  let vMin item 2 s-bounds
  let vMax item 3 s-bounds
  
  let p-bounds item 1 walk-params  
  let xMin first p-bounds                              ; p-bounds contains  xw-min xw-max the problem range of the scale
  let xMax item 1 p-bounds
  let target 0 
  if stage = "Horizontal" [
    set Target ( uMax - uMin ) * patch-size / grid-separation  ]      ; sets the target number of tics based on the size of the graphing area                                                     
    ; allocates about grid-separation pixels per tic
  if stage = "Vertical" [
      set Target ( vMax - vMin ) * patch-size / grid-separation  ]      ; sets the target number of tics based on the size of the graphing area                                                     
  let a ticMarks xMin xMax Target                  ; a now contains Low, Hi, and ntics, the low end of the scale in problem units, the high end, and the number of  tics

  let Low first a                                     ; unpack a
  let Hi item 1 a                                     ; Low and Hi are the min and max in problem coordinates
  let NTics last a   
  ifelse stage = "Horizontal"  
    [set a mcCoef Low Hi uMin uMax]                       ; get the transform pair m, c for u = mx + c
    [set a mcCoef Low Hi vMin vMax]
  let m first a
  let c last a
  let trans (list m c NTics Low Hi)
  set walk-params replace-item 3 walk-params trans    ; update the walk-params global with the computed transformation coefficients
end

to draw-stage                                           ; draws the horizontal scale on the stage--no vertical scale is needed
 if stage = "Horizontal" [                           ; do this entire procedure only if the stage is horizontal
  let s-bounds first walk-params                       ; unpack needed variables
  let uMin first s-bounds
  let uMax item 1 s-bounds
  let vMin item 2 s-bounds                             ; sbounds contains uw-min uw-max v-walk the screen location of the scale 
  let vMax item 3 s-bounds
  let vert ( 2 * vMin + vMax) / 3                           ; put the scale down the middle of the stage

  let p-bounds item 1 walk-params  
  let xMin first p-bounds                              ; p-bounds contains  xw-min yw-max the problem range of the scale
  let xMax item 1 p-bounds
  
  let tag-line item 2 walk-params
  
  let coef item 3 walk-params
  let m first coef        
  let c item 1 coef
  let nTics item 2 coef    ;the number of tics along the x-axis
  let Low item 3 coef      ;the starting x-value on the x-axis
  let Hi item 4 coef       ;the ending x-value on the x-axis
  
  let ticLength 3                                      ; the length of the tic marks below the grid
  let dxx (Hi - Low)/(Ntics - 1)                       ;  the distance between x-tics in problem coordinates
  let x Low
  repeat Ntics [
    create-scale-tics 1 [                              ; create the vertical tic lines by drawing down from the top
      set label precision x 3
      set heading 180                                  ; aim down
      set color gray set pen-size 2                
      setxy (m * x + c) vert 
      st
        ]
     set x x + dxx ]                                   ; at this point turtles are poised to descend from the top of the graph
   ask scale-tics [ pd fd ticLength]                   ; draws all the verticals at once 
   ask markers [                                       ; draw horiontal line
     setxy uMin vert
     set color white
     set pen-size 2
     set heading 90
     pd
     fd uMax - uMin
     pu ] 
   create-labels 1 [ ht setxy (umax + umin) / 2 vert - 5 set label tag-line st ]]
end

to-report ticMarks [zMin zMax targetNumber]
     ; Computes the scaling parameters.
     ; Inputs are:
     ;     the beginning of the scale
     ;     The end of the scale
     ;     The target number of tic marks in the scale
     ; returns Scaleinfo, a list. 
     ;    The first item is the beginning of the scale (rounded down to an even number)
     ;    The second item is the end of the scale (rounded up)
     ;    The third item is the actual interval
     ;    The fourth number of tics (differnet from nTics)
   if ( zMax < zMin ) [                       ; swap if in the wrong order
     let z zMax
     set zMax zMin
     set zMin z ]
      ; compute the target interval between scale divisions (tic marks) in problem coordinates.
      ; note that if there are N tic marks, there are N-1 intervals.
   let dz  (zMax - zMin) / (targetNumber - 1) ; the value of the interval for the target number of tics
   let y log dz 10                            ; compute the log base 10 of dz
   let a floor y                              ; round y down to the nearest smaller integer
   let z y - a                                ; z is the fractional part of the log
   let r 0
   ifelse z < .15                             ; if z is less than .15 set r to 1
     [set r 1]
     [ifelse z < .5                           ; otherwise if it is less than .5 set r to 2
        [set r  2]
        [ifelse  z < .85                      ; otherwise if it is less that .85 set r to 5
          [set r 5 ]                          ; and if all else fails, set r to 10
          [set r 10 ]]]                       ; r is the nearest 'nice' number to z: 1, 2, 5 or 10                        
   set dz  r * 10 ^ a                         ; dz is now the "corrected" tic interval
   let k floor (zMin / dz)                  
   let lowtic k * dz
   let ntics 1 + ceiling (zMax / dz ) - k     ; the actual number of tic marks
   let hitic lowtic + dz * (ntics - 1)  
   report (list lowtic hitic ntics)
end
   
to-report mcCoef [zMin zMax wMin wMax]        ; computes a and b coefficients to transform z-values into w-values
   let m (wMax - wMin)/(zMax - zMin)          ; use m*z + c to transform from z to w 
   let c  wMin - m * zMin
   report list m c
end 



   
@#$#@#$#@
GRAPHICS-WINDOW
7
10
618
472
56
40
5.321
1
10
1
1
1
0
0
0
1
-56
56
-40
40
0
0
0
ticks

BUTTON
734
107
805
140
Move #1
move-it 1
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
235
473
338
506
Zoom Selection
zoom
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
342
473
434
506
Auto-scale
auto-scale
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
734
174
805
207
Delete
Delete
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
625
344
725
377
Animate #1
animate-actor-1
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
626
107
734
140
Sketch a graph
sketch-graph
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
734
139
805
172
Move #2
move-it 2
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
625
376
725
410
Animate #2
animate-actor-2
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
625
410
725
443
Animate Both
animate-both
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

INPUTBOX
630
217
918
277
Expression
x * (a * x + b) + c
1
0
String

SLIDER
625
276
766
309
a-in-expression
a-in-expression
-10
10
7
.1
1
NIL
HORIZONTAL

SLIDER
625
309
766
342
b-in-expression
b-in-expression
-10
10
-0.2
.1
1
NIL
HORIZONTAL

CHOOSER
638
32
764
77
Graph-color
Graph-color
"Red" "Green" "Yellow" "Blue" "Orange" "Magenta"
2

CHOOSER
725
344
817
389
Actor-1-color
Actor-1-color
"Red" "Green" "Yellow" "Blue" "Orange" "Magenta"
2

CHOOSER
725
389
817
434
Actor-2-color
Actor-2-color
"Red" "Green" "Yellow" "Blue" "Orange" "Magenta"
0

BUTTON
626
140
734
173
Graph Expression
graph-expression
T
1
T
OBSERVER
NIL
NIL
NIL
NIL

SLIDER
764
276
918
309
c-in-expression
c-in-expression
-10
10
0.8
.1
1
NIL
HORIZONTAL

BUTTON
846
26
916
61
Reset
startup
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

INPUTBOX
438
473
528
533
Min-x
0
1
0
Number

INPUTBOX
528
473
618
533
Max-x
12
1
0
Number

BUTTON
818
421
918
454
Quadratic fit
quadratic-fit
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

CHOOSER
818
62
916
107
Stage
Stage
"Vertical" "Horizontal" "None"
2

TEXTBOX
773
12
849
41
Always select color first.
11
0.0
1

SLIDER
625
456
918
489
Animation-speed
Animation-speed
.5
100
44.5
.5
1
NIL
HORIZONTAL

CHOOSER
817
344
918
389
Fit-color
Fit-color
"Red" "Green" "Yellow" "Blue" "Orange" "Magenta"
5

CHOOSER
816
116
917
161
Actor-1
Actor-1
"None" "Airplane" "Ambulance" "Balloon" "Baseball" "Boat" "Bug" "Bus" "Butterfly" "Car" "Cow" "Doctor" "Farmer" "Fish" "Fish2" "Girl" "Monster" "Rocket" "Spider" "Squirrel" "Train" "Truck" "Turtle" "UFO" "Wheelchair"
4

CHOOSER
816
161
917
206
Actor-2
Actor-2
"None" "Airplane" "Ambulance" "Balloon" "Baseball" "Boat" "Bug" "Bus" "Butterfly" "Car" "Cow" "Doctor" "Farmer" "Fish" "Fish2" "Girl" "Monster" "Rocket" "Spider" "Squirrel" "Train" "Truck" "Turtle" "UFO" "Wheelchair"
14

INPUTBOX
438
533
529
593
Min-y
-1
1
0
Number

INPUTBOX
529
533
618
593
Max-y
7
1
0
Number

INPUTBOX
28
540
338
600
Tag-text
What happened here?
1
0
String

BUTTON
131
472
234
505
Select
select ; select sets the global 'selected-box'
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
29
472
132
505
Erase Selection
Erase-selected
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
818
389
918
422
Linear Fit
linear-fit
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
235
506
338
539
Tag Selection
make-tag
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
342
505
434
538
Set Scales
Set-scale
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
29
506
132
539
Undo Erase
Undo-erase
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
342
537
434
570
Hide Offscale
ask dots with [shape = \"default\"][ht]
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
626
174
734
207
Bring Front
Bring-front
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

BUTTON
624
493
735
526
NIL
linear-match
NIL
1
T
OBSERVER
NIL
NIL
NIL
NIL

SLIDER
747
493
919
526
fit%
fit%
0
10
3.4
.1
1
%
HORIZONTAL

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

ant
true
0
Polygon -7500403 true true 136 61 129 46 144 30 119 45 124 60 114 82 97 37 132 10 93 36 111 84 127 105 172 105 189 84 208 35 171 11 202 35 204 37 186 82 177 60 180 44 159 32 170 44 165 60
Polygon -7500403 true true 150 95 135 103 139 117 125 149 137 180 135 196 150 204 166 195 161 180 174 150 158 116 164 102
Polygon -7500403 true true 149 186 128 197 114 232 134 270 149 282 166 270 185 232 171 195 149 186
Polygon -7500403 true true 225 66 230 107 159 122 161 127 234 111 236 106
Polygon -7500403 true true 78 58 99 116 139 123 137 128 95 119
Polygon -7500403 true true 48 103 90 147 129 147 130 151 86 151
Polygon -7500403 true true 65 224 92 171 134 160 135 164 95 175
Polygon -7500403 true true 235 222 210 170 163 162 161 166 208 174
Polygon -7500403 true true 249 107 211 147 168 147 168 150 213 150

arrow
true
0
Polygon -7500403 true true 150 0 0 150 105 150 105 293 195 293 195 150 300 150

arrow tool
true
0
Polygon -1 true false 150 150 120 210 150 195 180 210
Line -1 false 150 195 150 300

balloon
false
0
Circle -7500403 true true 73 0 152
Polygon -7500403 true true 219 104 205 133 185 165 174 190 165 210 165 225 150 225 147 119
Polygon -7500403 true true 79 103 95 133 115 165 126 190 135 210 135 225 150 225 154 120
Rectangle -6459832 true false 129 241 173 273
Line -16777216 false 135 225 135 240
Line -16777216 false 165 225 165 240
Line -16777216 false 150 225 150 240

baseball
false
0
Circle -7500403 true true 30 30 240
Polygon -2674135 true false 247 79 243 86 237 106 232 138 232 167 235 199 239 215 244 225 236 234 229 221 224 196 220 163 221 138 227 102 234 83 240 71
Polygon -2674135 true false 53 79 57 86 63 106 68 138 68 167 65 199 61 215 56 225 64 234 71 221 76 196 80 163 79 138 73 102 66 83 60 71
Line -2674135 false 241 149 210 149
Line -2674135 false 59 149 90 149
Line -2674135 false 241 171 212 176
Line -2674135 false 246 191 218 203
Line -2674135 false 251 207 227 226
Line -2674135 false 251 93 227 74
Line -2674135 false 246 109 218 97
Line -2674135 false 241 129 212 124
Line -2674135 false 59 171 88 176
Line -2674135 false 59 129 88 124
Line -2674135 false 54 109 82 97
Line -2674135 false 49 93 73 74
Line -2674135 false 54 191 82 203
Line -2674135 false 49 207 73 226

boat
false
0
Polygon -1 true false 63 162 90 207 223 207 290 162
Rectangle -6459832 true false 150 32 157 162
Polygon -13345367 true false 150 34 131 49 145 47 147 48 149 49
Polygon -7500403 true true 158 33 230 157 182 150 169 151 157 156
Polygon -7500403 true true 149 55 88 143 103 139 111 136 117 139 126 145 130 147 139 147 146 146 149 55

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

bus
false
0
Polygon -7500403 true true 15 206 15 150 15 120 30 105 270 105 285 120 285 135 285 206 270 210 30 210
Rectangle -16777216 true false 36 126 231 159
Line -7500403 false 60 135 60 165
Line -7500403 false 60 120 60 165
Line -7500403 false 90 120 90 165
Line -7500403 false 120 120 120 165
Line -7500403 false 150 120 150 165
Line -7500403 false 180 120 180 165
Line -7500403 false 210 120 210 165
Line -7500403 false 240 135 240 165
Rectangle -16777216 true false 15 174 285 182
Circle -16777216 true false 48 187 42
Rectangle -16777216 true false 240 127 276 205
Circle -16777216 true false 195 187 42
Line -7500403 false 257 120 257 207

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

dashed box
false
0
Rectangle -7500403 true true 0 0 15 45
Rectangle -7500403 true true 0 75 15 105
Rectangle -7500403 true true 0 135 15 165
Rectangle -7500403 true true 0 255 15 300
Rectangle -7500403 true true 0 285 45 300
Rectangle -7500403 true true 75 285 105 300
Rectangle -7500403 true true 195 285 225 300
Rectangle -7500403 true true 255 285 300 300
Rectangle -7500403 true true 0 0 45 15
Rectangle -7500403 true true 75 0 105 15
Rectangle -7500403 true true 195 0 225 15
Rectangle -7500403 true true 255 0 300 15
Rectangle -7500403 true true 285 0 300 45
Rectangle -7500403 true true 285 75 300 105
Rectangle -7500403 true true 285 195 300 225
Rectangle -7500403 true true 285 255 300 300
Rectangle -7500403 true true 120 120 180 135
Rectangle -7500403 true true 0 195 15 225
Rectangle -7500403 true true 135 0 165 15
Rectangle -7500403 true true 285 135 300 165
Rectangle -7500403 true true 135 285 165 300
Rectangle -7500403 true true 165 135 180 165
Rectangle -7500403 true true 120 165 180 180
Rectangle -7500403 true true 120 135 135 165

doctor
false
0
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Polygon -13345367 true false 135 90 150 105 135 135 150 150 165 135 150 105 165 90
Polygon -7500403 true true 105 90 60 195 90 210 135 105
Polygon -7500403 true true 195 90 240 195 210 210 165 105
Circle -7500403 true true 110 5 80
Rectangle -7500403 true true 127 79 172 94
Polygon -1 true false 105 90 60 195 90 210 114 156 120 195 90 270 210 270 180 195 186 155 210 210 240 195 195 90 165 90 150 150 135 90
Line -16777216 false 150 148 150 270
Line -16777216 false 196 90 151 149
Line -16777216 false 104 90 149 149
Circle -1 true false 180 0 30
Line -16777216 false 180 15 120 15
Line -16777216 false 150 195 165 195
Line -16777216 false 150 240 165 240
Line -16777216 false 150 150 165 150

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

farmer
false
0
Polygon -7500403 true true 105 90 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 195 90
Polygon -1 true false 60 195 90 210 114 154 120 195 180 195 187 157 210 210 240 195 195 90 165 90 150 105 150 150 135 90 105 90
Circle -7500403 true true 110 5 80
Rectangle -7500403 true true 127 79 172 94
Polygon -13345367 true false 120 90 120 180 120 195 90 285 105 300 135 300 150 225 165 300 195 300 210 285 180 195 180 90 172 89 165 135 135 135 127 90
Polygon -6459832 true false 116 4 113 21 71 33 71 40 109 48 117 34 144 27 180 26 188 36 224 23 222 14 178 16 167 0
Line -16777216 false 225 90 270 90
Line -16777216 false 225 15 225 90
Line -16777216 false 270 15 270 90
Line -16777216 false 247 15 247 90
Rectangle -6459832 true false 240 90 255 300

fish
false
0
Polygon -1 true false 44 131 21 87 15 86 0 120 15 150 0 180 13 214 20 212 45 166
Polygon -1 true false 135 195 119 235 95 218 76 210 46 204 60 165
Polygon -1 true false 75 45 83 77 71 103 86 114 166 78 135 60
Polygon -7500403 true true 30 136 151 77 226 81 280 119 292 146 292 160 287 170 270 195 195 210 151 212 30 166
Circle -16777216 true false 215 106 30

fish2
false
0
Polygon -7500403 true true 137 105 124 83 103 76 77 75 53 104 47 136
Polygon -7500403 true true 226 194 223 229 207 243 178 237 169 203 167 175
Polygon -7500403 true true 137 195 124 217 103 224 77 225 53 196 47 164
Polygon -7500403 true true 40 123 32 109 16 108 0 130 0 151 7 182 23 190 40 179 47 145
Polygon -7500403 true true 45 120 90 105 195 90 275 120 294 152 285 165 293 171 270 195 210 210 150 210 45 180
Circle -1184463 true false 244 128 26
Circle -16777216 true false 248 135 14
Line -16777216 false 48 121 133 96
Line -16777216 false 48 179 133 204
Polygon -7500403 true true 241 106 241 77 217 71 190 75 167 99 182 125
Line -16777216 false 226 102 158 95
Line -16777216 false 171 208 225 205
Polygon -1 true false 252 111 232 103 213 132 210 165 223 193 229 204 247 201 237 170 236 137
Polygon -1 true false 135 98 140 137 135 204 154 210 167 209 170 176 160 156 163 126 171 117 156 96
Polygon -16777216 true false 192 117 171 118 162 126 158 148 160 165 168 175 188 183 211 186 217 185 206 181 172 171 164 156 166 133 174 121
Polygon -1 true false 40 121 46 147 42 163 37 179 56 178 65 159 67 128 59 116

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

girl
false
0
Polygon -7500403 true true 225 180 240 210 225 225 210 195
Polygon -7500403 true true 75 180 60 210 75 225 90 195
Polygon -7500403 true true 225 180 240 210 225 225 210 195
Polygon -2064490 true false 120 195 180 195 210 285 195 300 165 300 150 300 135 300 105 300 90 285
Polygon -1 true false 180 90 195 90 240 195 210 210 180 150 180 195 120 195 120 150 90 210 60 195 105 90 120 90 135 105 150 165 165 105 180 90
Polygon -7500403 true true 177 90 150 150 123 90
Rectangle -7500403 true true 124 76 177 92
Circle -7500403 true true 110 5 80
Line -13345367 false 179 90 106 90
Line -16777216 false 152 158 150 211
Rectangle -16777216 true false 118 186 184 198
Circle -1 true false 139 143 9
Circle -1 true false 139 166 9
Rectangle -16777216 true false 117 164 121 186
Polygon -2674135 true false 120 90 105 90 117 160 120 195 150 195 150 150 120 90
Polygon -2674135 true false 180 90 195 90 186 161 180 195 150 195 150 150 180 90
Polygon -1184463 true false 150 0 195 15 210 60 210 75 180 90 180 60 180 30 150 15 150 0
Polygon -1184463 true false 150 0 105 15 90 60 90 75 120 90 120 60 135 30 150 15 150 0

hand tool
true
0
Circle -1 true false 120 135 30
Rectangle -1 true false 135 135 300 165
Circle -1 true false 195 165 30
Circle -1 true false 210 195 30
Circle -1 true false 225 225 30
Rectangle -1 true false 210 165 300 195
Rectangle -1 true false 225 195 300 225
Rectangle -1 true false 240 225 300 255

help
false
6
Rectangle -6459832 true false 60 75 255 225
Rectangle -10899396 true false 75 90 240 210
Polygon -7500403 true false 75 210 240 210 255 225 60 225
Polygon -1 true false 60 75 255 75 240 90 75 90
Rectangle -16777216 true false 120 105 135 195
Rectangle -16777216 true false 120 150 195 165
Rectangle -16777216 true false 180 105 195 195

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

monster
false
0
Polygon -7500403 true true 75 150 90 195 210 195 225 150 255 120 255 45 180 0 120 0 45 45 45 120
Circle -16777216 true false 165 60 60
Circle -16777216 true false 75 60 60
Polygon -7500403 true true 225 150 285 195 285 285 255 300 255 210 180 165
Polygon -7500403 true true 75 150 15 195 15 285 45 300 45 210 120 165
Polygon -7500403 true true 210 210 225 285 195 285 165 165
Polygon -7500403 true true 90 210 75 285 105 285 135 165
Rectangle -7500403 true true 135 165 165 270

ok
false
11
Rectangle -6459832 true false 60 75 255 225
Rectangle -955883 true false 75 90 240 210
Polygon -7500403 true false 75 210 240 210 255 225 60 225
Polygon -1 true false 60 75 255 75 240 90 75 90
Circle -16777216 true false 90 120 60
Circle -955883 true false 99 129 42
Rectangle -16777216 true false 165 120 180 180
Polygon -16777216 true false 210 120 180 150 210 180 225 180 195 150 195 165 195 150 225 120 210 120

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

sarah
false
0
Polygon -2064490 true false 180 195 120 195 90 285 105 300 135 300 150 300 165 300 195 300 210 285
Polygon -1 true false 120 90 105 90 60 195 90 210 120 150 120 195 180 195 180 150 210 210 240 195 195 90 180 90 165 105 150 165 135 105 120 90
Polygon -1 true false 123 90 149 141 177 90
Rectangle -7500403 true true 123 76 176 92
Circle -7500403 true true 110 5 80
Line -13345367 false 121 90 194 90
Line -16777216 false 148 143 150 196
Rectangle -16777216 true false 116 186 182 198
Circle -1 true false 152 143 9
Circle -1 true false 152 166 9
Rectangle -16777216 true false 179 164 183 186
Polygon -2674135 true false 180 90 195 90 183 160 180 195 150 195 150 135 180 90
Polygon -2674135 true false 120 90 105 90 114 161 120 195 150 195 150 135 120 90
Polygon -13345367 true false 151 85 137 112 161 112
Polygon -1184463 true false 120 0 90 30 90 60 75 90 120 75 135 30 165 30 180 75 225 90 195 15 165 0 120 0

select tool
false
0
Line -1 false 150 0 150 105
Line -1 false 0 150 90 150
Line -1 false 150 195 150 300
Line -1 false 210 150 300 150
Circle -1 false false 135 135 30

sheep
false
0
Rectangle -7500403 true true 151 225 180 285
Rectangle -7500403 true true 47 225 75 285
Rectangle -7500403 true true 15 75 210 225
Circle -7500403 true true 135 75 150
Circle -16777216 true false 165 76 116

spider
true
0
Polygon -7500403 true true 134 255 104 240 96 210 98 196 114 171 134 150 119 135 119 120 134 105 164 105 179 120 179 135 164 150 185 173 199 195 203 210 194 240 164 255
Line -7500403 true 167 109 170 90
Line -7500403 true 170 91 156 88
Line -7500403 true 130 91 144 88
Line -7500403 true 133 109 130 90
Polygon -7500403 true true 167 117 207 102 216 71 227 27 227 72 212 117 167 132
Polygon -7500403 true true 164 210 158 194 195 195 225 210 195 285 240 210 210 180 164 180
Polygon -7500403 true true 136 210 142 194 105 195 75 210 105 285 60 210 90 180 136 180
Polygon -7500403 true true 133 117 93 102 84 71 73 27 73 72 88 117 133 132
Polygon -7500403 true true 163 140 214 129 234 114 255 74 242 126 216 143 164 152
Polygon -7500403 true true 161 183 203 167 239 180 268 239 249 171 202 153 163 162
Polygon -7500403 true true 137 140 86 129 66 114 45 74 58 126 84 143 136 152
Polygon -7500403 true true 139 183 97 167 61 180 32 239 51 171 98 153 137 162

square
false
0
Rectangle -7500403 true true 30 30 270 270

square 2
false
0
Rectangle -7500403 true true 30 30 270 270
Rectangle -16777216 true false 60 60 240 240

squirrel
false
0
Polygon -7500403 true true 87 267 106 290 145 292 157 288 175 292 209 292 207 281 190 276 174 277 156 271 154 261 157 245 151 230 156 221 171 209 214 165 231 171 239 171 263 154 281 137 294 136 297 126 295 119 279 117 241 145 242 128 262 132 282 124 288 108 269 88 247 73 226 72 213 76 208 88 190 112 151 107 119 117 84 139 61 175 57 210 65 231 79 253 65 243 46 187 49 157 82 109 115 93 146 83 202 49 231 13 181 12 142 6 95 30 50 39 12 96 0 162 23 250 68 275
Polygon -16777216 true false 237 85 249 84 255 92 246 95
Line -16777216 false 221 82 213 93
Line -16777216 false 253 119 266 124
Line -16777216 false 278 110 278 116
Line -16777216 false 149 229 135 211
Line -16777216 false 134 211 115 207
Line -16777216 false 117 207 106 211
Line -16777216 false 91 268 131 290
Line -16777216 false 220 82 213 79
Line -16777216 false 286 126 294 128
Line -16777216 false 193 284 206 285

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

train
false
0
Rectangle -7500403 true true 30 105 240 150
Polygon -7500403 true true 240 105 270 30 180 30 210 105
Polygon -7500403 true true 195 180 270 180 300 210 195 210
Circle -7500403 true true 0 165 90
Circle -7500403 true true 240 225 30
Circle -7500403 true true 90 165 90
Circle -7500403 true true 195 225 30
Rectangle -7500403 true true 0 30 105 150
Rectangle -16777216 true false 30 60 75 105
Polygon -7500403 true true 195 180 165 150 240 150 240 180
Rectangle -7500403 true true 135 75 165 105
Rectangle -7500403 true true 225 120 255 150
Rectangle -16777216 true false 30 203 150 218

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

ufo
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

wheelchair
false
0
Circle -7500403 true true 15 120 180
Circle -1 true false 45 150 120
Polygon -1 true false 75 120 90 195 165 195 180 255 195 225 180 195 105 195 90 120
Polygon -7500403 true true 75 30 105 195 180 195 225 285 285 255 270 240 240 255 195 165 135 165 105 45
Circle -7500403 true true 75 15 60
Polygon -1 true false 120 120 165 135 180 165 135 165 120 120 135 165
Rectangle -7500403 true true 120 120 195 135

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
