Sub Main()

  msgPort = CreateObject("roMessagePort")

  ear = newEar(msgPort)
  eventLoop(msgPort)

  ' unreachable code

  print "PhotoPlayer start"
  manifest$ = ReadAsciiFile("usb1:/mediaItems/photoCollectionManifest.json")
  photoManifest = ParseJson(manifest$)

  photoIds = photoManifest.albums.Cabo2018
  numPhotos% = photoIds.count()
  photoIndex% = 0

  EnableZoneSupport(true)

  r = CreateObject("roRectangle", 0, 0, 1920, 1080)
  imagePlayer = CreateObject("roImageWidget", r)
  imagePlayer.SetDefaultMode(1)
	imagePlayer.Show()


  timer = CreateObject("roTimer")
  timer.setPort(msgPort)
  timer.SetElapsed(4, 0)
  timer.Start()

  aa = {}
  photoId$ = photoIds[photoIndex%]
  filePath$ = "usb1:/mediaItems/" + photoId$ + ".jpg"
  aa.filename = filePath$
  ok = imagePlayer.DisplayFile(aa)
  print "DisplayFile returned: ";ok
  print filePath$

  while true

    event = wait(0, msgPort)

    print "event: " + type(event)

    if type(event) = "roTimerEvent" then

      photoIndex% = photoIndex% + 1
      if photoIndex% >= numPhotos% then
        photoIndex% = 0
      endif

      photoId$ = photoIds[photoIndex%]
      filePath$ = "usb1:/mediaItems/" + photoId$ + ".jpg"
      aa.filename = filePath$
      ok = imagePlayer.DisplayFile(aa)
      print "DisplayFile returned: ";ok
      print filePath$

      timer.Start()

    endif

  end while

End Sub


Sub EventLoop(msgPort As Object)

  while true
    event = wait(0, msgPort)
    print "event: " + type(event)

    if type(event) = "roHtmlWidgetEvent" then
      eventData = event.GetData()
      print "reason: ";eventData.reason
      if eventData.reason = "message" then
        print "message: ";eventData.message
      endif
    endif
  end while

End Sub

Function newEar(msgPort As Object) As Object

  t = {}
  t.msgPort = msgPort

  print "=== Setting up node server..."
  t.htmlRect = CreateObject("roRectangle", 0, 0, 1000, 1080)
  is = {
      port: 2999
  }
  config = {
      nodejs_enabled: true,
      inspector_server: is,
      brightsign_js_objects_enabled: true,
      javascript_enabled: true,
      url:  "file:///sd:/server.html",
      security_params: {websecurity: false}
  }
  t.htmlNet = CreateObject("roHtmlWidget", t.htmlRect, config)
  t.htmlNet.setPort(t.msgPort)
  t.htmlNet.AllowJavaScriptUrls({ all: "*" })
  t.htmlNet.SetUserData("server")
  t.htmlNet.Show()

  return t

End Function
