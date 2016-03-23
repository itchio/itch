
# diego

diego is our diagnostics mercenary: it attempts to dump information about the
Operating System, CPU and Graphics Card to a log file when someone tries to
install a game.

You can [read its source](../app/util/diego.js), or look at these example outputs


## Example outputs

Windows 8.1 64-bit, Intel Core i3, GTX 560 Ti:

```
[Tue, 15 Dec 2015 14:02:36 GMT] [diego] diego here, looking around
[Tue, 15 Dec 2015 14:02:37 GMT] [diego]
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Microsoft Windows [Version 6.3.9600]
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Caption                               MaxClockSpeed  Name                                             
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Intel64 Family 6 Model 37 Stepping 5  3077           Intel(R) Core(TM) i3 CPU         540  @ 3.07GHz  
[Tue, 15 Dec 2015 14:02:37 GMT] [diego]
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] Name                       
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] NVIDIA GeForce GTX 560 Ti  
[Tue, 15 Dec 2015 14:02:37 GMT] [diego]
[Tue, 15 Dec 2015 14:02:37 GMT] [diego] diego out
```

Ubuntu 15.10 Wily amd64, running in VirtualBox:

```
[Tue, 15 Dec 2015 14:48:07 GMT] [diego] diego here, looking around
[Tue, 15 Dec 2015 14:48:08 GMT] [diego] Linux zogzog 4.2.0-18-generic #22-Ubuntu SMP Fri Nov 6 18:25:50 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] Distributor ID:	Ubuntu
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] Description:	Ubuntu 15.10
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] Release:	15.10
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] Codename:	wily
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] 00:02.0 VGA compatible controller: InnoTek Systemberatung GmbH VirtualBox Graphics Adapter
[Tue, 15 Dec 2015 14:48:09 GMT] [diego] diego out
```

MacBook Pro (Retina, 15-inch, Mid 2014), OSX El Capitan, 10.11.2, Intel Iris Pro:

```
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] diego here, looking around
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] Darwin dople.local 15.2.0 Darwin Kernel Version 15.2.0: Fri Nov 13 19:56:56 PST 2015; root:xnu-3248.20.55~2/RELEASE_X86_64 x86_64
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] ProductName:	Mac OS X
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] ProductVersion:	10.11.2
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] BuildVersion:	15C50
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] Hardware:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]     Hardware Overview:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Model Name: MacBook Pro
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Model Identifier: MacBookPro11,2
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Processor Name: Intel Core i7
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Processor Speed: 2,2 GHz
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Number of Processors: 1
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Total Number of Cores: 4
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       L2 Cache (per Core): 256 KB
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       L3 Cache: 6 MB
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Memory: 16 GB
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Boot ROM Version: MBP112.0138.B16
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       SMC Version (system): 2.18f15
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Serial Number (system): C02N821WG3QN
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Hardware UUID: 0452EC36-8965-5FB1-A46C-C5087A21DF19
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] Graphics/Displays:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]     Intel Iris Pro:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Chipset Model: Intel Iris Pro
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Type: GPU
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Bus: Built-In
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       VRAM (Dynamic, Max): 1536 MB
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Vendor: Intel (0x8086)
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Device ID: 0x0d26
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Revision ID: 0x0008
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]       Displays:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]         Color LCD:
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Display Type: Retina LCD
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Resolution: 2880 x 1800 Retina
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Retina: Yes
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Pixel Depth: 32-Bit Color (ARGB8888)
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Main Display: Yes
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Mirror: Off
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Online: Yes
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]           Built-In: Yes
[Tue, 15 Dec 2015 14:08:41 GMT] [diego]
[Tue, 15 Dec 2015 14:08:41 GMT] [diego] diego out
```
