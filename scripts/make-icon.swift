import AppKit

let size = 1024
let image = NSImage(size: NSSize(width: size, height: size))
let ink = NSColor(calibratedRed: 0.20, green: 0.18, blue: 0.16, alpha: 1)
let paper = NSColor(calibratedRed: 0.97, green: 0.94, blue: 0.88, alpha: 1)
image.lockFocus()
NSColor.clear.setFill()
NSRect(x: 0, y: 0, width: size, height: size).fill()
ink.setFill()
NSBezierPath(roundedRect: NSRect(x: 80, y: 80, width: 864, height: 864), xRadius: 175, yRadius: 175).fill()
// Paper, platen and carriage.
paper.setFill()
NSBezierPath(roundedRect: NSRect(x: 335, y: 540, width: 354, height: 254), xRadius: 12, yRadius: 12).fill()
let platen = NSBezierPath(roundedRect: NSRect(x: 245, y: 510, width: 534, height: 55), xRadius: 18, yRadius: 18)
platen.fill()
NSBezierPath(roundedRect: NSRect(x: 210, y: 495, width: 35, height: 90), xRadius: 10, yRadius: 10).fill()
NSBezierPath(roundedRect: NSRect(x: 779, y: 495, width: 35, height: 90), xRadius: 10, yRadius: 10).fill()
// Typewriter body.
let body = NSBezierPath()
body.move(to: NSPoint(x: 293, y: 505)); body.line(to: NSPoint(x: 731, y: 505))
body.line(to: NSPoint(x: 800, y: 270)); body.line(to: NSPoint(x: 224, y: 270)); body.close(); body.fill()
ink.setFill()
for row in 0..<3 {
  for column in 0..<8 {
    let x = 292 + column * 55 + (row % 2) * 10
    let y = 410 - row * 48
    NSBezierPath(ovalIn: NSRect(x: x, y: y, width: 27, height: 27)).fill()
  }
}
NSBezierPath(roundedRect: NSRect(x: 355, y: 292, width: 314, height: 17), xRadius: 7, yRadius: 7).fill()
NSRect(x: 388, y: 716, width: 244, height: 15).fill()
NSRect(x: 388, y: 671, width: 185, height: 15).fill()
image.unlockFocus()
let bitmap = NSBitmapImageRep(data: image.tiffRepresentation!)!
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "build/icon-1024.png"))
