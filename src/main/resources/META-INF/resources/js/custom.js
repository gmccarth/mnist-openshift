// Canvas setup
var canvas = new fabric.Canvas('canvas');
canvas.isDrawingMode = true;
canvas.freeDrawingBrush.width = 20;
canvas.freeDrawingBrush.color = "#ffffff";
canvas.backgroundColor = "#000000";
canvas.renderAll();

const mouseUp = () => {

  this.mouse.down = false;
      
      // stop drawing
  this.context.closePath();
      
      // Scale down.
  this.scaleDown();
};



// Clear button callback
$("#clear-canvas").click(function(){ 
  canvas.clear(); 
  canvas.backgroundColor = "#000000";
  canvas.renderAll();
  updateChart(zeros);
  $("#status").removeClass();
});


// Predict button callback
$("#predict").click(function(){  

  // Change status indicator
  $("#status").removeClass().toggleClass("fa fa-spinner fa-spin");


  // Get canvas contents as url
  // var fac = (1.) / 26.; 
  // var url = canvas.toDataURLWithMultiplier('png', fac);
  // console.log("URL: " +  url);
  // console.log("URL length: " +  url.length);
  // var startIndex = url.indexOf(',');
  


  var tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 28;
  tmpCanvas.height = 28;
  var tmpContext = tmpCanvas.getContext('2d');

// copy the content of the photo-canvas to the temp canvas rescaled
  var photoCanvas = document.getElementById("canvas");
  tmpContext.drawImage(photoCanvas,                                // source
                    0, 0, photoCanvas.width, photoCanvas.height, // source rect
                    0, 0, 28, 28                               // destination rect
                   );
  // get data-url of temporary canvas
  var base64 = tmpCanvas.toDataURL("image/png");
  // console.log("tmpCanvas: " + base64)
  // console.log("tmpCanvas size = " + base64.length)
  // imageB64 = url.substring(startIndex + 1);

  var startIndex = base64.indexOf(',');
  imageB64 = base64.substring(startIndex + 1);
  // console.log("startIndex = " + startIndex);
  imageSer = encodeURIComponent(imageB64);
  // console.log("B64-serialized: " + imageSer);
  // console.log("B64-serialized.size: " + imageSer.length);

  // Post url to python script
  var jq = $.post('/image?image='+ imageSer)
      .done(function () {
	     $("#status").removeClass().toggleClass("fa fa-check");
	     $('#svg-chart').show();
      } );

  //  .done(function (json) {
  //    if (true) {
  //      $("#status").removeClass().toggleClass("fa fa-check");
  //      $('#svg-chart').show();
  //      updateChart(json.data);
  //    } else {
  //       $("#status").removeClass().toggleClass("fa fa-exclamation-triangle");
  //       console.log('Script Error: ' + json.error)
  //    }
  //  })
  //  .fail(function (xhr, textStatus, error) {
  //    $("#status").removeClass().toggleClass("fa fa-exclamation-triangle");
  //    console.log("POST Error: " + xhr.responseText + ", " + textStatus + ", " + error);
  //  }
  //);
  scaleDown();
  
});

// Iniitialize d3 bar chart
$('#svg-chart').hide();
var labels = ['0','1','2','3','4','5','6','7','8','9'];
var zeros = [0,0,0,0,0,0,0,0,0,0,0];

var margin = {top: 0, right: 0, bottom: 20, left: 0},
    width = 360 - margin.left - margin.right,
    height = 180 - margin.top - margin.bottom;

var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1)
    .domain(labels);
    
var y = d3.scale.linear()
          .range([height, 0])
          .domain([0,1]);  

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(0);

svg.selectAll(".bar")
    .data(zeros)
  .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d, i) { return x(i); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d); })
    .attr("height", function(d) { return height - y(d); });

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// Update chart data
function updateChart(data) {
  d3.selectAll("rect")
    .data(data)
    .transition()
    .duration(500)
    .attr("y", function(d) { return y(d); })
    .attr("height", function(d) { return height - y(d); });
}

function scaleDown() {
    const originalCanvas = document.getElementById('canvas');
    const boundedCanvas = document.getElementById('bounded');

    const mnistCanvas = document.getElementById('mnist');
    
    const originalCtx = originalCanvas.getContext('2d');
    const boundedCtx = boundedCanvas.getContext('2d');

    const mnistCtx = mnistCanvas.getContext('2d');

    const imgData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    
    const data = imgData.data;
    const pixels = [[]];
    
    // console.log(pixels);
    
    let row = 0;
    let column = 0;
    for (let i = 0; i < originalCanvas.width * originalCanvas.height * 4; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3] / 255;
      // console.log("a:" +a );
      
      if (column >= originalCanvas.width) {
        column = 0;
        row++;
        pixels[row] = [];
      }
      
      pixels[row].push(Math.round(a * 100) / 100);
      
      column++;

    }
    
    const boundingRectangle = getBoundingRectangle(pixels);
    console.log({boundingRectangle});
    
   
    const array = pixels.reduce(
      (arr, row) => [].concat(arr, row.reduce(
        (concatedRow, alpha) => [].concat(concatedRow, [0, 0, 0, alpha * 255]), []))
    , []);
                                
                                
    const clampedArray =  new Uint8ClampedArray(array);
    // console.log("pixels Array: " + pixels.toString());
    // console.log("array: " + array.length);
    console.log("clampedArray: " + clampedArray.length);
    const bounded = new ImageData(clampedArray, boundedCanvas.width, boundedCanvas.height);
    
    boundedCtx.putImageData(bounded, 0, 0);
    
    boundedCtx.beginPath();
    boundedCtx.lineWidth= '1';
    boundedCtx.strokeStyle= 'red';
    boundedCtx.rect(
      boundingRectangle.minX,
      boundingRectangle.minY,
      Math.abs(boundingRectangle.minX - boundingRectangle.maxX),
      Math.abs(boundingRectangle.minY - boundingRectangle.maxY),
    ); 
    boundedCtx.stroke();
    
    // Vector that shifts an image to the center of the mass.
    const trans = this.centerImage(pixels); // [dX, dY] to center of mass
    console.log({trans});

  // copy image to hidden canvas, translate to center-of-mass, then
  // scale to fit into a 200x200 box (see MNIST calibration notes on
  // Yann LeCun's website)
    
 
 // var brW = boundingRectangle.maxX + 1 - boundingRectangle.minX;
 // var brH = boundingRectangle.maxY + 1 - boundingRectangle.minY;
  // var scaling = (centeredCanvas.width / 2) / (brW > brH ? brW : brH);
    
    
// //     var img = centeredCtx.createImageData(100, 100);
// //     for (var i = img.data.length; --i >= 0; )
// //       img.data[i] = 0;
// //     centeredCtx.putImageData(img, 100, 100);

// //     centeredCtx.setTransform(1, 0, 0, 1, 0, 0);
    
//   // scale
//   // centeredCtx.translate(centeredCanvas.width / 2, centeredCanvas.height/ 2);
//   // centeredCtx.scale(scaling, scaling);
//   // centeredCtx.translate(-centeredCanvas.width/2, -centeredCanvas.height/2);
    
//   // translate to center of mass
//   centeredCtx.translate(trans.transX, trans.transY);
//   centeredCtx.clearRect(0, 0, centeredCanvas.width, centeredCanvas.height);
//   centeredCtx.drawImage(originalCtx.canvas, 0, 0);
    
//   // scaledCtx.clearRect(0, 0, scaledCanvas.width, scaledCanvas.height);
//   // scaledCtx.drawImage(centeredCtx.canvas, 0, 0);
    
    
    // Get width and height of the bounding box of the segmented digit.
    const brW = boundingRectangle.maxX + 1 - boundingRectangle.minX;
    const brH = boundingRectangle.maxY + 1 - boundingRectangle.minY;
    // Set the scaling factor in a way that will uniformy decarease width and height of bounding box so that it fits 20x20pixel window
    const scalingFactor = 20 / Math.max(brW, brH);
    // var scaling = (centeredCanvas.width / 2) / (brW > brH ? brW : brH);
    // const scaleX = 20 /brW;
    // const scaleY= 20 / brH;
    // // scaledCtx.translate(scaledCtx.width / 2, scaledCtx.height / 2);
    // scaledCtx.scale(scaleX, scaleY);
    // // scaledCtx.translate(-scaledCtx.width/2, -scaledCtx.height /2);
    // scaledCtx.clearRect(0, 0, scaledCtx.width, scaledCtx.height);
    // scaledCtx.drawImage(originalCtx.canvas, 0, 0);
   
 
    
    // Reset the drawing.
    var img = mnistCtx.createImageData(100, 100);
    for (var i = img.data.length; --i >= 0; )
      img.data[i] = 0;
    mnistCtx.putImageData(img, 100, 100);

    // Reset the tranforms
    mnistCtx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear the canvas.
    mnistCtx.clearRect(0, 0, mnistCanvas.width, mnistCanvas.height);
    
    // Ensure that 20x20 square that bound the digit is centered on 28x28 canvas.
    // mnistCtx.translate(4, 4);
    
    /**
     * This is just for demo and should be removed.
     * Drawing centered 20x20 rectrangle centerad at 28x28 canvas.
     */
    mnistCtx.beginPath();
    mnistCtx.lineWidth= '1';
    mnistCtx.strokeStyle= 'green';
    mnistCtx.rect(4, 4, 20, 20); 
    mnistCtx.stroke();
    
    // mnistCtx.scale(scalingFactor, scalingFactor);
    mnistCtx.translate(
      -brW * scalingFactor / 2,
      -brH * scalingFactor / 2
    );
    mnistCtx.translate(
      mnistCtx.canvas.width / 2,
      mnistCtx.canvas.height / 2
    );
    mnistCtx.translate(
      -Math.min(boundingRectangle.minX, boundingRectangle.maxX) * scalingFactor,
      -Math.min(boundingRectangle.minY, boundingRectangle.maxY) * scalingFactor
    );
    mnistCtx.scale(scalingFactor, scalingFactor);
    
    // mnistCtx.translate(scaledCtx.width / 2, scaledCtx.height / 2);
    // mnistCtx.scale(scaleX, scaleY);
    // mnistCtx.translate(-scaledCtx.width/2, -scaledCtx.height /2);
    // mnistCtx.clearRect(0, 0, 28, 28);
    mnistCtx.drawImage(originalCtx.canvas, 0, 0);
    // mnistCtx.rect(0, 0, 20, 20); 
   
  }

  function getBoundingRectangle(img, threshold = 0.01) {
    const rows = img.length;
    const columns= img[0].length;

    let minX = columns;
    let minY = rows;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (img[y][x] > 1 -  threshold) {
          if (minX > x) minX = x;
          if (maxX < x) maxX = x;
          if (minY > y) minY = y;
          if (maxY < y) maxY = y;
        }
      }
    }
    return { minY, minX, maxY, maxX };
  }
//----------------------------
// Bounding box for centering
//----------------------------
function boundingBox() {
  var minX = Math.min.apply(Math, clickX) - 20;
  var maxX = Math.max.apply(Math, clickX) + 20;
  
  var minY = Math.min.apply(Math, clickY) - 20;
  var maxY = Math.max.apply(Math, clickY) + 20;

  var tempCanvas = document.createElement("canvas"),
  tCtx = tempCanvas.getContext("2d");

  tempCanvas.width  = maxX - minX;
  tempCanvas.height = maxY - minY;

  tCtx.drawImage(canvas, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);

  var imgBox = document.getElementById("canvas_image");
  imgBox.src = tempCanvas.toDataURL();

  return tempCanvas;
}

  function preprocessCanvas(image){
    let tensor = tf.browser.fromPixels(image)
        .resizeNearestNeighbor([28, 28])
        .mean(2)
        .toFloat()
        .reshape([1 , 784]);
    return tensor.div(255.0);
  }
  }