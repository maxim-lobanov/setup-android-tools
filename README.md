# setup-android-tools
This action is intended to install Android tools on Hosted images in GitHub Actions.  
It wraps `sdkmanager` and automates caching of installed packages.

### Usage
Install single package without cache:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: setup-android-tools
      uses: maxim-lobanov/setup-android-tools@v1.0
      with:
        packages: ndk;19.2.5345600
```

Install multiple packages without cache:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: maxim-lobanov/setup-android-tools@v1.0
      with:
        packages: |
          platforms;android-29
          platforms;android-30
          system-images;android-30;google_apis;x86
```

Install package with cache:
```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: maxim-lobanov/setup-android-tools@v1.0
      with:
        packages: ndk;19.2.5345600
        cache: true
```

### Cache packages
With `cache: true`, action will automatically cache all downloaded packages via [@actions/cache](https://github.com/actions/toolkit/tree/main/packages/cache). In some cases, it could significantly speed up your builds (especially on MacOS images).

> **Note:** GitHub will remove any cache entries that have not been accessed in over 7 days. There is no limit on the number of caches you can store, but the total size of all caches in a repository is limited to 5 GB. If you exceed this limit, GitHub will save your cache but will begin evicting caches until the total size is less than 5 GB.  
See "[Caching dependencies to speed up workflows](https://help.github.com/github/automating-your-workflow-with-github-actions/caching-dependencies-to-speed-up-workflows)" for how caching works.

<details><summary>More details about speed advantage of using cache</summary>
<br>
(Table contains average results since installation time may vary depending on VM connection speed)

| Packages | OS | With cache (sec) | Without cache (sec) |
|-|-|-|-|
|ndk;19.2.5345600| Ubuntu  |  62 | 85 |
| | Windows | 149 | 180 |
| | MacOS   | 25  | 71 |
| ndk-bundle<br>system-images;android-30;google_apis;x86<br>system-images;android-30;google_apis;x86_64 | Ubuntu | 130 | 167 |
| | Windows | 157 | 182 |
| | MacOS | 43 | 205 |
| platforms;android-20<br>add-ons;addon-google_apis-google-20<br>constraint-layout-solver;1.0.0-alpha8<br>extras;google;webdriver | Ubuntu | 10 | 20 |
| | Windows | 28 | 42 |
| | MacOS | 8 | 59 |
</details>


### License
The scripts and documentation in this project are released under the [MIT License](LICENSE)
