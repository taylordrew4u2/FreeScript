import AppKit

let size = 1024
let image = NSImage(size: NSSize(width: size, height: size))
image.lockFocus()
NSColor.clear.setFill()
NSRect(x: 0, y: 0, width: size, height: size).fill()
let tile = NSBezierPath(roundedRect: NSRect(x: 80, y: 80, width: 864, height: 864), xRadius: 190, yRadius: 190)
NSColor(calibratedRed: 0.16, green: 0.28, blue: 0.24, alpha: 1).setFill()
tile.fill()
let feather = NSBezierPath()
feather.move(to: NSPoint(x: 290, y: 290))
feather.curve(to: NSPoint(x: 730, y: 750), controlPoint1: NSPoint(x: 330, y: 610), controlPoint2: NSPoint(x: 510, y: 820))
feather.curve(to: NSPoint(x: 290, y: 290), controlPoint1: NSPoint(x: 820, y: 520), controlPoint2: NSPoint(x: 580, y: 360))
NSColor(calibratedRed: 0.91, green: 0.94, blue: 0.83, alpha: 1).setFill()
feather.fill()
let line = NSBezierPath()
line.move(to: NSPoint(x: 270, y: 270))
line.line(to: NSPoint(x: 615, y: 615))
line.lineWidth = 28
line.lineCapStyle = .round
NSColor(calibratedRed: 0.16, green: 0.28, blue: 0.24, alpha: 1).setStroke()
line.stroke()
let stem = NSBezierPath()
stem.move(to: NSPoint(x: 262, y: 262))
stem.line(to: NSPoint(x: 380, y: 380))
stem.lineWidth = 27
stem.lineCapStyle = .round
NSColor(calibratedRed: 0.91, green: 0.94, blue: 0.83, alpha: 1).setStroke()
stem.stroke()
image.unlockFocus()
let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
let data = bitmap.representation(using: .png, properties: [:])!
try data.write(to: URL(fileURLWithPath: "build/icon-1024.png"))
