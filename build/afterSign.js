const { notarize } = require('@electron/notarize')

exports.default = function (context) {
  console.log('Notarizing')
  // Get contex vars
  const appName = context.packager.appInfo.productFilename
  const appDir = context.appOutDir

  // Notarize
  return notarize({
    appBundleId: 'com.jtvberg.temporal',
    appPath: `${appDir}/${appName}.app`,
    appleId: process.env.appleId,
    appleIdPassword: process.env.appleIdPassword
  })
}
