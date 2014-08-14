const lightGridColor = "rgba(0,0,0,0.2)";
const darkGridColor = "rgba(0,0,0,0.7)";
const transparentColor = "rgba(0, 0, 0, 0)";
const gridBackgroundColor = "rgba(255, 255, 255, 0.8)";

function drawPausedInDebuggerMessage(message)
{
    window._controlsVisible = true;
    document.querySelector(".controls-line").style.visibility = "visible";
    document.getElementById("paused-in-debugger").textContent = message;
    document.body.classList.add("dimmed");
}

function _drawGrid(rulerAtRight, rulerAtBottom)
{
    if (window._gridPainted)
        return;
    window._gridPainted = true;

    context.save();

    var pageFactor = pageZoomFactor * pageScaleFactor;
    function zoom(x)
    {
        return Math.round(x * pageFactor);
    }
    function unzoom(x)
    {
        return Math.round(x / pageFactor);
    }

    var width = canvasWidth / pageFactor;
    var height = canvasHeight / pageFactor;

    const gridSubStep = 5;
    const gridStep = 50;

    {
        // Draw X grid background
        context.save();
        context.fillStyle = gridBackgroundColor;
        if (rulerAtBottom)
            context.fillRect(0, zoom(height) - 15, zoom(width), zoom(height));
        else
            context.fillRect(0, 0, zoom(width), 15);

        // Clip out backgrounds intersection
        context.globalCompositeOperation = "destination-out";
        context.fillStyle = "red";
        if (rulerAtRight)
            context.fillRect(zoom(width) - 15, 0, zoom(width), zoom(height));
        else
            context.fillRect(0, 0, 15, zoom(height));
        context.restore();

        // Draw Y grid background
        context.fillStyle = gridBackgroundColor;
        if (rulerAtRight)
            context.fillRect(zoom(width) - 15, 0, zoom(width), zoom(height));
        else
            context.fillRect(0, 0, 15, zoom(height));
    }

    context.lineWidth = 1;
    context.strokeStyle = darkGridColor;
    context.fillStyle = darkGridColor;
    {
        // Draw labels.
        context.save();
        context.translate(-scrollX, 0.5 - scrollY);
        var maxY = height + unzoom(scrollY);
        for (var y = 2 * gridStep; y < maxY; y += 2 * gridStep) {
            context.save();
            context.translate(scrollX, zoom(y));
            context.rotate(-Math.PI / 2);
            context.fillText(y, 2, rulerAtRight ? zoom(width) - 7 : 13);
            context.restore();
        }
        context.translate(0.5, -0.5);
        var maxX = width + unzoom(scrollX);
        for (var x = 2 * gridStep; x < maxX; x += 2 * gridStep) {
            context.save();
            context.fillText(x, zoom(x) + 2, rulerAtBottom ? scrollY + zoom(height) - 7 : scrollY + 13);
            context.restore();
        }
        context.restore();
    }

    {
        // Draw vertical grid
        context.save();
        if (rulerAtRight) {
            context.translate(zoom(width), 0);
            context.scale(-1, 1);
        }
        context.translate(-scrollX, 0.5 - scrollY);
        var maxY = height + unzoom(scrollY);
        for (var y = gridStep; y < maxY; y += gridStep) {
            context.beginPath();
            context.moveTo(scrollX, zoom(y));
            var markLength = (y % (gridStep * 2)) ? 5 : 8;
            context.lineTo(scrollX + markLength, zoom(y));
            context.stroke();
        }
        context.strokeStyle = lightGridColor;
        for (var y = gridSubStep; y < maxY; y += gridSubStep) {
            if (!(y % gridStep))
                continue;
            context.beginPath();
            context.moveTo(scrollX, zoom(y));
            context.lineTo(scrollX + gridSubStep, zoom(y));
            context.stroke();
        }
        context.restore();
    }

    {
        // Draw horizontal grid
        context.save();
        if (rulerAtBottom) {
            context.translate(0, zoom(height));
            context.scale(1, -1);
        }
        context.translate(0.5 - scrollX, -scrollY);
        var maxX = width + unzoom(scrollX);
        for (var x = gridStep; x < maxX; x += gridStep) {
            context.beginPath();
            context.moveTo(zoom(x), scrollY);
            var markLength = (x % (gridStep * 2)) ? 5 : 8;
            context.lineTo(zoom(x), scrollY + markLength);
            context.stroke();
        }
        context.strokeStyle = lightGridColor;
        for (var x = gridSubStep; x < maxX; x += gridSubStep) {
            if (!(x % gridStep))
                continue;
            context.beginPath();
            context.moveTo(zoom(x), scrollY);
            context.lineTo(zoom(x), scrollY + gridSubStep);
            context.stroke();
        }
        context.restore();
    }

    context.restore();
}

function quadToPath(quad)
{
    context.beginPath();
    context.moveTo(quad[0].x, quad[0].y);
    context.lineTo(quad[1].x, quad[1].y);
    context.lineTo(quad[2].x, quad[2].y);
    context.lineTo(quad[3].x, quad[3].y);
    context.closePath();
    return context;
}

function drawOutlinedQuad(quad, fillColor, outlineColor)
{
    context.save();
    context.lineWidth = 2;
    quadToPath(quad).clip();
    context.fillStyle = fillColor;
    context.fill();
    if (outlineColor) {
        context.strokeStyle = outlineColor;
        context.stroke();
    }
    context.restore();
}

function drawOutlinedQuadWithClip(quad, clipQuad, fillColor)
{
    context.fillStyle = fillColor;
    context.save();
    context.lineWidth = 0;
    quadToPath(quad).fill();
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "red";
    quadToPath(clipQuad).fill();
    context.restore();
}

function drawUnderlyingQuad(quad, fillColor)
{
    context.save();
    context.lineWidth = 2;
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = fillColor;
    quadToPath(quad).fill();
    context.restore();
}

function quadEquals(quad1, quad2)
{
    return quad1[0].x === quad2[0].x && quad1[0].y === quad2[0].y &&
        quad1[1].x === quad2[1].x && quad1[1].y === quad2[1].y &&
        quad1[2].x === quad2[2].x && quad1[2].y === quad2[2].y &&
        quad1[3].x === quad2[3].x && quad1[3].y === quad2[3].y;
}

function drawViewSize(drawViewSizeWithGrid)
{
    var drawGridBoolean = drawViewSizeWithGrid === "true";
    var text = viewportSize.width + "px \u00D7 " + viewportSize.height + "px";
    context.save();
    context.font = "20px ";
    switch (platform) {
    case "windows": context.font = "14px Consolas"; break;
    case "mac": context.font = "14px Menlo"; break;
    case "linux": context.font = "14px dejavu sans mono"; break;
    }

    var frameWidth = frameViewFullSize.width || canvasWidth;
    var textWidth = context.measureText(text).width;
    context.fillStyle = gridBackgroundColor;
    context.fillRect(frameWidth - textWidth - 12, drawGridBoolean ? 15 : 0, frameWidth, 25);
    context.fillStyle = darkGridColor;
    context.fillText(text, frameWidth - textWidth - 6, drawGridBoolean ? 33 : 18);
    context.restore();
    if (drawGridBoolean)
        _drawGrid();
}

function reset(resetData)
{
    window.viewportSize = resetData.viewportSize;
    window.frameViewFullSize = resetData.frameViewFullSize;
    window.deviceScaleFactor = resetData.deviceScaleFactor;
    window.pageZoomFactor = resetData.pageZoomFactor;
    window.pageScaleFactor = resetData.pageScaleFactor;
    window.scrollX = Math.round(resetData.scrollX * pageScaleFactor);
    window.scrollY = Math.round(resetData.scrollY * pageScaleFactor);

    window.canvas = document.getElementById("canvas");
    window.context = canvas.getContext("2d");

    canvas.width = deviceScaleFactor * viewportSize.width;
    canvas.height = deviceScaleFactor * viewportSize.height;
    canvas.style.width = viewportSize.width + "px";
    canvas.style.height = viewportSize.height + "px";
    context.scale(deviceScaleFactor, deviceScaleFactor);
    window.canvasWidth = viewportSize.width;
    window.canvasHeight = viewportSize.height;

    window._controlsVisible = false;
    document.querySelector(".controls-line").style.visibility = "hidden";
    document.getElementById("element-title").style.visibility = "hidden";
    document.body.classList.remove("dimmed");
    window._gridPainted = false;
}

function _drawElementTitle(highlight)
{
    var elementInfo = highlight.elementInfo;
    if (!highlight.elementInfo)
        return;

    document.getElementById("tag-name").textContent = elementInfo.tagName;
    document.getElementById("node-id").textContent = elementInfo.idValue ? "#" + elementInfo.idValue : "";
    var className = elementInfo.className;
    if (className && className.length > 50)
       className = className.substring(0, 50) + "\u2026";
    document.getElementById("class-name").textContent = className || "";
    document.getElementById("node-width").textContent = elementInfo.nodeWidth;
    document.getElementById("node-height").textContent = elementInfo.nodeHeight;
    var elementTitle = document.getElementById("element-title");

    var marginQuad = highlight.quads[0];

    var titleWidth = elementTitle.offsetWidth + 6;
    var titleHeight = elementTitle.offsetHeight + 4;

    var anchorTop = marginQuad[0].y;
    var anchorBottom = marginQuad[3].y

    const arrowHeight = 7;
    var renderArrowUp = false;
    var renderArrowDown = false;

    var boxX = Math.max(2, marginQuad[0].x);
    if (boxX + titleWidth > canvasWidth)
        boxX = canvasWidth - titleWidth - 2;

    var boxY;
    if (anchorTop > canvasHeight) {
        boxY = canvasHeight - titleHeight - arrowHeight;
        renderArrowDown = true;
    } else if (anchorBottom < 0) {
        boxY = arrowHeight;
        renderArrowUp = true;
    } else if (anchorBottom + titleHeight + arrowHeight < canvasHeight) {
        boxY = anchorBottom + arrowHeight - 4;
        renderArrowUp = true;
    } else if (anchorTop - titleHeight - arrowHeight > 0) {
        boxY = anchorTop - titleHeight - arrowHeight + 3;
        renderArrowDown = true;
    } else
        boxY = arrowHeight;

    context.save();
    context.translate(0.5, 0.5);
    context.beginPath();
    context.moveTo(boxX, boxY);
    if (renderArrowUp) {
        context.lineTo(boxX + 2 * arrowHeight, boxY);
        context.lineTo(boxX + 3 * arrowHeight, boxY - arrowHeight);
        context.lineTo(boxX + 4 * arrowHeight, boxY);
    }
    context.lineTo(boxX + titleWidth, boxY);
    context.lineTo(boxX + titleWidth, boxY + titleHeight);
    if (renderArrowDown) {
        context.lineTo(boxX + 4 * arrowHeight, boxY + titleHeight);
        context.lineTo(boxX + 3 * arrowHeight, boxY + titleHeight + arrowHeight);
        context.lineTo(boxX + 2 * arrowHeight, boxY + titleHeight);
    }
    context.lineTo(boxX, boxY + titleHeight);
    context.closePath();
    context.fillStyle = "rgb(255, 255, 194)";
    context.fill();
    context.strokeStyle = "rgb(128, 128, 128)";
    context.stroke();

    context.restore();

    elementTitle.style.visibility = "visible";
    elementTitle.style.top = (boxY + 3) + "px";
    elementTitle.style.left = (boxX + 3) + "px";
}

function _drawRulers(highlight, rulerAtRight, rulerAtBottom)
{
    context.save();
    var width = canvasWidth;
    var height = canvasHeight;
    context.strokeStyle = "rgba(128, 128, 128, 0.3)";
    context.lineWidth = 1;
    context.translate(0.5, 0.5);
    var leftmostXForY = {};
    var rightmostXForY = {};
    var topmostYForX = {};
    var bottommostYForX = {};

    for (var i = 0; i < highlight.quads.length; ++i) {
        var quad = highlight.quads[i];
        for (var j = 0; j < quad.length; ++j) {
            var x = quad[j].x;
            var y = quad[j].y;
            leftmostXForY[Math.round(y)] = Math.min(leftmostXForY[y] || Number.MAX_VALUE, Math.round(quad[j].x));
            rightmostXForY[Math.round(y)] = Math.max(rightmostXForY[y] || Number.MIN_VALUE, Math.round(quad[j].x));
            topmostYForX[Math.round(x)] = Math.min(topmostYForX[x] || Number.MAX_VALUE, Math.round(quad[j].y));
            bottommostYForX[Math.round(x)] = Math.max(bottommostYForX[x] || Number.MIN_VALUE, Math.round(quad[j].y));
        }
    }

    if (rulerAtRight) {
        for (var y in rightmostXForY) {
            context.beginPath();
            context.moveTo(width, y);
            context.lineTo(rightmostXForY[y], y);
            context.stroke();
        }
    } else {
        for (var y in leftmostXForY) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(leftmostXForY[y], y);
            context.stroke();
        }
    }

    if (rulerAtBottom) {
        for (var x in bottommostYForX) {
            context.beginPath();
            context.moveTo(x, height);
            context.lineTo(x, topmostYForX[x]);
            context.stroke();
        }
    } else {
        for (var x in topmostYForX) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, topmostYForX[x]);
            context.stroke();
        }
    }

    context.restore();
}

function drawNodeHighlight(highlight)
{
    {
        for (var i = 0; i < highlight.quads.length; ++i) {
            var quad = highlight.quads[i];
            for (var j = 0; j < quad.length; ++j) {
                quad[j].x = Math.round(quad[j].x * pageScaleFactor - scrollX);
                quad[j].y = Math.round(quad[j].y * pageScaleFactor - scrollY);
            }
        }
    }

    if (!highlight.quads.length) {
        if (highlight.showRulers)
            _drawGrid(false, false);
        return;
    }

    context.save();

    var quads = highlight.quads.slice();
    var eventTargetQuad = quads.length >= 5 ? quads.pop() : null;
    var contentQuad = quads.pop();
    var paddingQuad = quads.pop();
    var borderQuad = quads.pop();
    var marginQuad = quads.pop();

    var hasContent = contentQuad && highlight.contentColor !== transparentColor || highlight.contentOutlineColor !== transparentColor;
    var hasPadding = paddingQuad && highlight.paddingColor !== transparentColor;
    var hasBorder = borderQuad && highlight.borderColor !== transparentColor;
    var hasMargin = marginQuad && highlight.marginColor !== transparentColor;
    var hasEventTarget = eventTargetQuad && highlight.eventTargetColor !== transparentColor;

    var clipQuad;
    if (hasMargin && (!hasBorder || !quadEquals(marginQuad, borderQuad))) {
        drawOutlinedQuadWithClip(marginQuad, borderQuad, highlight.marginColor);
        clipQuad = borderQuad;
    }
    if (hasBorder && (!hasPadding || !quadEquals(borderQuad, paddingQuad))) {
        drawOutlinedQuadWithClip(borderQuad, paddingQuad, highlight.borderColor);
        clipQuad = paddingQuad;
    }
    if (hasPadding && (!hasContent || !quadEquals(paddingQuad, contentQuad))) {
        drawOutlinedQuadWithClip(paddingQuad, contentQuad, highlight.paddingColor);
        clipQuad = contentQuad;
    }
    if (hasContent)
        drawOutlinedQuad(contentQuad, highlight.contentColor, highlight.contentOutlineColor);
    if (hasEventTarget)
        drawUnderlyingQuad(eventTargetQuad, highlight.eventTargetColor);

    var width = canvasWidth;
    var height = canvasHeight;
    var minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, maxX = Number.MIN_VALUE; maxY = Number.MIN_VALUE;
    for (var i = 0; i < highlight.quads.length; ++i) {
        var quad = highlight.quads[i];
        for (var j = 0; j < quad.length; ++j) {
            minX = Math.min(minX, quad[j].x);
            maxX = Math.max(maxX, quad[j].x);
            minY = Math.min(minY, quad[j].y);
            maxY = Math.max(maxY, quad[j].y);
        }
    }

    var rulerAtRight = minX < 20 && maxX + 20 < width;
    var rulerAtBottom = minY < 20 && maxY + 20 < height;

    if (highlight.showRulers) {
        _drawGrid(rulerAtRight, rulerAtBottom);
        _drawRulers(highlight, rulerAtRight, rulerAtBottom);
    }
    _drawElementTitle(highlight);

    context.restore();
}

function drawQuadHighlight(highlight)
{
    context.save();
    drawOutlinedQuad(highlight.quads[0], highlight.contentColor, highlight.contentOutlineColor);
    context.restore();
}

function setPlatform(platform)
{
    window.platform = platform;
    document.body.classList.add("platform-" + platform);
}

function dispatch(message)
{
    var functionName = message.shift();
    window[functionName].apply(null, message);
}

function log(text)
{
    var logEntry = document.createElement("div");
    logEntry.textContent = text;
    document.getElementById("log").appendChild(logEntry);
}

function onResumeClick()
{
    InspectorOverlayHost.resume();
}

function onStepOverClick()
{
    InspectorOverlayHost.stepOver();
}

function onLoaded()
{
    document.getElementById("resume-button").addEventListener("click", onResumeClick);
    document.getElementById("step-over-button").addEventListener("click", onStepOverClick);
}

function eventHasCtrlOrMeta(event)
{
    return window.platform == "mac" ? (event.metaKey && !event.ctrlKey) : (event.ctrlKey && !event.metaKey);
}

function onDocumentKeyDown(event)
{
    if (!window._controlsVisible)
        return;
    if (event.keyIdentifier == "F8" || eventHasCtrlOrMeta(event) && event.keyCode == 220 /* backslash */)
        InspectorOverlayHost.resume();
    else if (event.keyIdentifier == "F10" || eventHasCtrlOrMeta(event) && event.keyCode == 222 /* single quote */)
        InspectorOverlayHost.stepOver();
}

window.addEventListener("DOMContentLoaded", onLoaded);
document.addEventListener("keydown", onDocumentKeyDown);