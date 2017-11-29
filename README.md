# Maritime navigation: The untapped potential of Information Systems in the Maldives

This is an experimental Information System Project that investigates the potential of Information Systems in a maritime setting, over 3G/4G Mobile data networks. It is intended exclusively for users in the Maldives, where such networks are possible at sea. The potentials for such a system is the subject of this experimental project, which uses Agile methodologies as per DSDM Atern where possible.
The products of this project are **odi**, an [Android App](https://github.com/athoof/odi); **faharu**, a [Web Server](https://github.com/athoof/faharu); and **vedi**, a Database server, using [React-Native](https://facebook.github.io/react-native/docs/getting-started.html), [NodeJS](https://nodejs.org/), and [RethinkDB](https://www.rethinkdb.com/). 

## Installation
To install the android app, you will need an Android device with Nougat or later. It is very likely the app will work for Lollipop and Marshmallow, but it is best supported by Nougat.

Simply copy odi.apk to your android device, and install like any ordinary app. Alternatively, grab the apk file from the website at [http://faharu.com/download](http://faharu.com/download)

The Android app does not function when not connected to the web server, which will be up 24/7 at [http://faharu.com](http://faharu.com)

To see the live website, please go to [http://faharu.com/](http://faharu.com/)

The faharu repository exists at [https://github.com/athoof/faharu](https://github.com/athoof/faharu) with all source code

The odi repository is at [https://github.com/athoof/odi](https://github.com/athoof/odi)

* * *

## Local setup (Only for testing)
If you would like to install the Faharu web server and site locally:

1. Install NodeJS from [https://nodejs.org/](https://nodejs.org/)

2. Install and launch RethinkDB from [https://www.rethinkdb.com/docs/install/](https://www.rethinkdb.com/docs/install/)

3. If you don't have it, install Git, [https://git-scm.com/book/en/v2/Getting-Started-Installing-Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

4. Open a terminal/shell and navigate to desired folder.

5. Input: ' git clone https://github.com/athoof/faharu.git && cd faharu && npm install && npm start '

6. Point your browser to localhost or 127.0.0.1

If you would like to compile the Android APK yourself:

1. Install Android SDK with API level 25 and necessary pre-requisites

2. Get the source code from [https://github.com/athoof/odi](https://github.com/athoof/odi)

3. Install React-Native, follow [https://facebook.github.io/react-native/docs/getting-started.html](https://facebook.github.io/react-native/docs/getting-started.html)

4. Do 'npm install' within work directory to install pre-requisites

5. Navigate to the 'android' folder in a shell

6. Execute: ' ./gradlew assembleRelease '

7. Find the complete file at android/app/build/outputs/apk

8. Install app-release.apk

Note: Compiling the APK yourself is not guaranteed to succeed since different machines may require special attention.

The original Android APK was compiled on a macOS Sierra.

