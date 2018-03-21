let startAngle = 20, stopAngle = -20, tmpAngle = -20;

let startAnimation = (latency) => {
    tmpAngle = startAngle;
    startAngle = stopAngle;
    stopAngle = tmpAngle;
    $({arrowRotation: startAngle}).animate({arrowRotation: stopAngle}, {
        duration: latency * 1000,
        step: function(angle) {
            $('#stick').css('transform', `rotate(${angle}deg)`);
        }
    })
};
