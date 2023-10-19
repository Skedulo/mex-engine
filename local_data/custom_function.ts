export default `
function canEdit(status) {
  return status == 'Awaiting Approval'
}

function alert(message, {extHelpers}) {
  extHelpers.ui.alert(message)
}

function canDelete(pageData, status, {converters}) {
  return converters.data.isTempUID(pageData) == false && canEdit(status)
}

function testMandatoryExpression() {
    return true
}

let exportFns = {
    canEdit: canEdit,
    canDelete: canDelete,
    alert,
    testMandatoryExpression
}
`

