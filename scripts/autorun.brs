Sub Main()

  print "PhotoPlayer start"
  manifest$ = ReadAsciiFile("usb1:/mediaItems/photoCollectionManifest.json")
  photoManifest = ParseJson(manifest$)

  photoIds = photoManifest.albums.Cabo2018
  print photoIds

  photoId$ = photoIds[0]
  filePath$ = "usb1:/mediaItems/" + photoId$ + ".jpg"

  EnableZoneSupport(true)

  r = CreateObject("roRectangle", 0, 0, 1920, 1080)
  imagePlayer = CreateObject("roImageWidget", r)
  imagePlayer.SetDefaultMode(1)
	imagePlayer.Show()

  aa = {}
  aa.filename = filePath$
  ok = imagePlayer.DisplayFile(aa)

  msgPort = CreateObject("roMessagePort")
  EventLoop(msgPort)

End Sub


Sub EventLoop(msgPort As Object)

  while true
    msg = wait(0, msgPort)
  end while

End Sub
