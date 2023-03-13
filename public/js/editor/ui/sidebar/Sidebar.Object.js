import * as THREE from "../../libs/three.module.js"

import {
  UIPanel,
  UIRow,
  UIInput,
  UIText,
  UINumber,
  UIDiv,
  UISpan,
  UIImage,
} from "../components/ui.js"
import {
  UIColorPicker,
  UIAccordion,
  UIStyledCheckbox,
  UIDropdown,
  UIGraph,
  UIColorGradientChooser,
} from "../components/ui.openstudio.js"
import { UITexture } from "../components/ui.three.js"
import isDefined from "../../utils/index"

import { SetParticleValueCommand } from "../../commands/SetParticleValueCommand.js"
import { SetValueCommand } from "../../commands/SetValueCommand.js"
import { SetPositionCommand } from "../../commands/SetPositionCommand.js"
import { SetRotationCommand } from "../../commands/SetRotationCommand.js"
import { SetScaleCommand } from "../../commands/SetScaleCommand.js"
import { SetColorCommand } from "../../commands/SetColorCommand.js"
import { SetVisibleCommand } from "../../commands/SetVisibleCommand.js"
import { SetAdvancedHelperCommand } from "../../commands/SetAdvancedHelperCommand.js"
import { SidebarObjectConnection } from "./Sidebar.Object.Connection.js"

function SidebarObject(editor) {
  var strings = editor.strings
  var config = editor.config
  var signals = editor.signals

  var container = new UIPanel()
  container.setDisplay("none")

  var object = editor.selected
  var userData = {}
  if (object && object.userData) {
    var userData = object.userData
  }

  // Movement

  var objectMovement = { controller: {} }
  var objectMovementRows = { controller: {} }
  var objectMovementConnections = {}

  var objectMovementAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/object/movement"))
    .setId("movement")

    ;["direction", "rotation", "grow"].map((t) => {
      objectMovement[t] = {}
      objectMovementRows[t] = new UIRow()
      objectMovementRows[t].add(new UIText(strings.getKey("sidebar/object/movement/" + t)))
        ;["x", "y", "z"].map((axis) => {
          objectMovement[t][axis] = {}
          objectMovement[t][axis]["label"] = new UIText(
            strings.getKey("sidebar/object/movement/" + axis)
          ).onClick(updateMovementConnectionRows.bind(this, t, axis))
          objectMovement[t][axis]["label"].addClass("connectionLabel")
          objectMovement[t][axis]["value"] = new UINumber().onChange(updateUserData)

          objectMovementRows[t].add(objectMovement[t][axis]["label"], objectMovement[t][axis]["value"])
        })

      objectMovementConnections[t] = new SidebarObjectConnection(editor, "movement" + t)
      objectMovementConnections[t].onChange(function (e) {
        var object = editor.selected

        if (!object.userData.connection) {
          object.userData.connection = {}
        }

        if (!object.userData.movement) {
          object.userData.movement = {
            controller: { type: "none" },
            direction: {},
            rotation: {},
            grow: {},
          }
        }

        var key = t == "rotation" ? "rotate" : t

        if (e.enabled) {
          if (!object.userData.connection[key]) {
            object.userData.connection[key] = {}
          }

          object.userData.connection[key][e.axis] = {}
          object.userData.connection[key][e.axis]["mouse"] = e.mouse
          object.userData.connection[key][e.axis]["speed"] = e.speed
          object.userData.connection[key][e.axis]["value"] = object.userData.movement[t][e.axis] || 0
        } else {
          delete object.userData.connection[key][e.axis]
        }

        updateConnectionUI(object)

        editor.execute(new SetValueCommand(editor, object, "userData", object.userData))
      })

      if (t != "grow") {
        objectMovement[t]["local"] = new UIStyledCheckbox(false)
          .setIdFor(`${t}-local`)
          .onChange(updateUserData)
        objectMovementRows[t].add(objectMovement[t]["local"])
      }

      objectMovementAccordion.addToBody(objectMovementRows[t])
      objectMovementAccordion.addToBody(objectMovementConnections[t])
    })
    ;["lookAt", "goTo"].map((t) => {
      objectMovementRows[t] = new UIDiv()

      var objectRow = new UIRow()
      objectMovement[t] = {}
      objectMovement[t]["uuid"] = new UIDropdown()
        .setId(t)
        .setOptions({})
        .onChange(movementSelectChanged)
      objectMovement[t]["speed"] = new UINumber().onChange(updateUserData)
      objectMovement[t]["label"] = new UIText(
        strings.getKey("sidebar/object/movement/" + t + "/speed")
      )
      objectRow.add(new UIText(strings.getKey("sidebar/object/movement/" + t)))
      objectRow.add(objectMovement[t]["uuid"])
      objectRow.add(objectMovement[t]["label"])
      objectRow.add(objectMovement[t]["speed"])

      var axisRow = new UIRow().setPaddingLeft("25px")
        ;["x", "y", "z"].map((axis) => {
          objectMovement[t][axis] = new UINumber().onChange(updateUserData)
          axisRow.add(new UIText(strings.getKey("sidebar/object/movement/" + axis)))
          axisRow.add(objectMovement[t][axis])
        })
      objectMovementAccordion.addToBody(axisRow)

      var axisEnabledRow = new UIRow().setPaddingLeft("25px")
        ;["x", "y", "z"].map((axis) => {
          objectMovement[t][axis + "Enabled"] = new UIStyledCheckbox(true)
            .setIdFor(`${t}-${axis}Enabled`)
            .onChange(updateUserData)
          axisEnabledRow.add(new UIText(strings.getKey("sidebar/object/movement/" + axis)))
          axisEnabledRow.add(objectMovement[t][axis + "Enabled"])
        })

      objectMovementRows[t].add(objectRow)
      objectMovementRows[t].add(axisRow)
      objectMovementRows[t].add(axisEnabledRow)
      objectMovementRows[t + "Axis"] = axisRow
      objectMovementRows[t + "AxisEnabled"] = axisEnabledRow
      objectMovementAccordion.addToBody(objectMovementRows[t])
    })

  var objectControlsRow = new UIRow()
  var objectControllerType = new UIDropdown().setOptions({}).onChange(movementSelectChanged)

  objectControlsRow.add(new UIText(strings.getKey("sidebar/object/movement/controller")))
  objectControlsRow.add(objectControllerType)
  objectMovementAccordion.addToBody(objectControlsRow)

  var objectControllerRows = {
    keyboard: [
      "localMovements",
      "movePlusX",
      "moveMinusX",
      "movePlusY",
      "moveMinusY",
      "movePlusZ",
      "moveMinusZ",
      "pitchPlusX",
      "pitchMinusX",
      "yawPlusY",
      "yawMinusY",
      "rollPlusZ",
      "rollMinusZ",
      "globalMovements",
      "globalMovePlusX",
      "globalMoveMinusX",
      "globalMovePlusY",
      "globalMoveMinusY",
      "globalMovePlusZ",
      "globalMoveMinusZ",
      "globalPitchPlusX",
      "globalPitchMinusX",
      "globalYawPlusY",
      "globalYawMinusY",
      "globalRollPlusZ",
      "globalRollMinusZ",
    ],
    bounce: ["speed", "x", "y", "z"],
    orbit: ["center", "zoom"],
    map: ["min", "max"],
    pointerLock: [
      "localMovements",
      "movePlusX",
      "moveMinusX",
      "movePlusZ",
      "moveMinusZ",
      "yPosition",
    ],
    lookAt: ["object", "axis", "axisEnabled"],
    follow: ["object", "distance"],
    WASDRF: ["movementSpeed", "pointerSpeed"],
  }

  for (var key in objectControllerRows) {
    var controller = {}
    objectMovementRows.controller[key] = new UIDiv()
    if (key === "orbit") {
      var centerRow = new UIRow()
      centerRow.add(
        new UIText(strings.getKey("sidebar/object/movement/controller/center")).setMarginLeft(
          "10px"
        )
      )
        ;["x", "y", "z"].map((axis) => {
          const field = new UINumber().onChange(()=>{
            updateUserData();
          })
          const id = "orbitCenter"+axis.toUpperCase();
          controller[id] = field;
          centerRow.add(controller[id]);
        })

      objectMovementRows.controller[key].add(centerRow)
        ;["zoom", "horizontal", "rotational"].map((type, index) => {
          var row = new UIRow()
          row.add(
            new UIText(strings.getKey("sidebar/object/movement/controller/" + type)).setMarginLeft(
              "10px"
            )
          )
          controller[type] = new UIStyledCheckbox(false)
            .setIdFor(type + "Enabled")
            .onChange(updateUserData)
          row.add(controller[type])
            ;["min", "max"].map((id) => {
              var name = type == "zoom" ? "distanceOrbit" : type
              var controllerId = id + (name.charAt(0).toUpperCase() + name.slice(1))
              row.add(new UIText(strings.getKey("sidebar/object/movement/controller/" + id)))
              controller[controllerId] = new UINumber().onChange(updateUserData)
              row.add(controller[controllerId])
            })

          objectMovementRows.controller[key].add(row)

          if (index == 0) {
            var zoomSpeedRow = new UIRow();
            controller["zoomSpeed"] = new UINumber(1).onChange(updateUserData)

            zoomSpeedRow.add(
              new UIText(
                strings.getKey("sidebar/object/movement/controller/zoom_speed")
              ).setMarginLeft("10px")
            )
            zoomSpeedRow.add(controller["zoomSpeed"])

            objectMovementRows.controller[key].add(zoomSpeedRow)
          }
        })
    } else if (key === "map") {
      var zoomRow = new UIRow()
      zoomRow.add(
        new UIText(strings.getKey("sidebar/object/movement/controller/zoom")).setMarginLeft("10px")
      )
      controller["zoomMap"] = new UIStyledCheckbox(true)
        .setIdFor("zoomMap")
        .onChange(updateUserData)
      zoomRow.add(controller["zoomMap"])
        ;["min", "max"].map((id) => {
          var controllerId = id + "DistanceMap"
          zoomRow.add(new UIText(strings.getKey("sidebar/object/movement/controller/" + id)))
          controller[controllerId] = new UINumber().onChange(updateUserData)
          zoomRow.add(controller[controllerId])
        })

      var zoomSpeedRow = new UIRow()
      controller["zoomSpeedMap"] = new UINumber(1).onChange(updateUserData)

      zoomSpeedRow.add(
        new UIText(strings.getKey("sidebar/object/movement/controller/zoom_speed")).setMarginLeft(
          "10px"
        )
      )
      zoomSpeedRow.add(controller["zoomSpeedMap"])

      objectMovementRows.controller[key].add(zoomRow, zoomSpeedRow)
    } else if (key === "lookAt") {
      var objectRow = new UIRow()
      var lookAtObjectUuid = new UIDropdown()
        .setOptions({})
        .setMarginLeft("10px")
        .onChange(updateLookAtRows)
        controller["uuid"] = lookAtObjectUuid;
      objectRow.add(new UIText(strings.getKey("sidebar/object/movement/lookAt/object")))
      objectRow.add(controller["uuid"])

      var lookAtDragRow = new UIRow();
      lookAtDragRow.add(new UIText(strings.getKey("sidebar/object/movement/lookAt/speed")))
      controller["speed"] = new UINumber().onChange(updateUserData)
      lookAtDragRow.add(controller["speed"])

      var axisEnabledRow = new UIRow().setPaddingLeft("25px")
        ;["x", "y", "z"].map((axis) => {
          controller[axis + "Enabled"] = new UIStyledCheckbox(true)
            .setIdFor(`controller-${key}-${axis}Enabled`)
            .onChange(updateUserData)
          axisEnabledRow.add(new UIText(strings.getKey("sidebar/object/movement/" + axis)))
          axisEnabledRow.add(controller[axis + "Enabled"])
        })

      var axisRow = new UIRow().setPaddingLeft("25px")
        ;["x", "y", "z"].map((axis) => {
          controller[axis] = new UINumber().onChange(updateUserData)
          axisRow.add(new UIText(strings.getKey("sidebar/object/movement/" + axis)))
          axisRow.add(controller[axis])
        })

      objectMovementRows.controller[key].add(objectRow)
      objectMovementRows.controller[key].add(lookAtDragRow)
      objectMovementRows.controller[key].add(axisEnabledRow)
      objectMovementRows.controller[key].add(axisRow)
    } else if (key === "follow") {
      var objectRow = new UIRow()
      controller["objectUuid"] = new UIDropdown()
        .setOptions({})
        .setMarginLeft("10px")
        .onChange(updateUserData)
      objectRow.add(new UIText(strings.getKey("sidebar/object/movement/controller/object")))
      objectRow.add(controller["objectUuid"])

      var distanceRow = new UIRow()
      controller["distance"] = new UINumber().onChange(updateUserData)
      distanceRow.add(new UIText(strings.getKey("sidebar/object/movement/controller/distance")))
      distanceRow.add(controller["distance"])

      objectMovementRows.controller[key].add(objectRow)
      objectMovementRows.controller[key].add(distanceRow)
    } else if (key === "WASDRF") {
      var movementSpeedRow = new UIRow().setPaddingLeft("25px")
      controller["movementSpeed"] = new UINumber().onChange(updateUserData)
      movementSpeedRow.add(
        new UIText(strings.getKey("sidebar/settings/workspace/navigation/WASDRF/movement"))
      )
      movementSpeedRow.add(controller["movementSpeed"])

      var pointerSpeedRow = new UIRow().setPaddingLeft("25px")
      controller["pointerSpeed"] = new UINumber().onChange(updateUserData)
      pointerSpeedRow.add(
        new UIText(strings.getKey("sidebar/settings/workspace/navigation/WASDRF/pointer"))
      )
      pointerSpeedRow.add(controller["pointerSpeed"])

      objectMovementRows.controller[key].add(movementSpeedRow, pointerSpeedRow)
    } else if (key === "bounce") {
      var speedRow = new UIRow().setPaddingLeft("25px")
      controller["speed"] = new UINumber().onChange(updateUserData)
      speedRow.add(new UIText(strings.getKey("sidebar/object/movement/controller/speed")))
      speedRow.add(controller["speed"])

      var startDirectionRow = new UIRow().setPaddingLeft("25px")
      var startDirections = new UIDiv()
      startDirectionRow.add(
        new UIText(strings.getKey("sidebar/object/movement/controller/startDirection"))
      )
      startDirectionRow.add(startDirections)
        ;["x", "y", "z"].map((axis) => {
          controller[axis] = new UINumber().onChange(updateUserData)
          startDirections.add(
            new UIText(strings.getKey("sidebar/object/movement/" + axis)).setPaddingLeft("3px")
          )
          startDirections.add(controller[axis])
        })

      objectMovementRows.controller[key].add(speedRow)
      objectMovementRows.controller[key].add(startDirectionRow)
    } else {
      objectControllerRows[key].map((id) => {
        var row = new UIRow()
        row.add(
          new UIText(strings.getKey("sidebar/object/movement/controller/" + id)).setMarginLeft(
            "10px"
          )
        )

        if (id == "yPosition") {
          controller[id] = new UINumber().setMarginLeft("5px").onChange(updateUserData)
          row.add(controller[id])
        } else if (id !== "localMovements" && id !== "globalMovements") {
          controller[id] = new UIInput().onChange(updateUserData)
          if(key == "keyboard")
          {
            controller[id].dom.maxLength = 1
          }
          row.add(controller[id])
          row.add(new UIText(strings.getKey("sidebar/object/movement/controller/speed")))
          controller[id + "Speed"] = new UINumber().onChange(updateUserData)
          row.add(controller[id + "Speed"])
        }

        

        objectMovementRows.controller[key].add(row)
      })
    }

    objectMovement.controller[key] = controller
    objectMovementAccordion.addToBody(objectMovementRows.controller[key])
  }

  container.add(objectMovementAccordion)

  // Selectable

  var selectableKeys = [
    "local",
    "grid",
    "translate",
    "rotate",
    "scale",
    "sizePlus",
    "sizeMinus",
    "toggleX",
    "toggleY",
    "toggleZ",
    "toggleEnabled",
  ]
  var objectSelectableAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/object/selectable"))
    .setId("selectable")

  var objectSelectedRow = new UIRow()
  var objectSelected = new UIStyledCheckbox(false)
    .setIdFor("objectSelected")
    .onChange(updateUserData)
  objectSelectedRow.add(new UIText(strings.getKey("sidebar/object/selectable/selected")))
  objectSelectedRow.add(objectSelected)

  var objectCanSelectRow = new UIRow()
  var objectCanSelect = new UIStyledCheckbox(true)
    .setIdFor("objectCanSelect")
    .onChange(updateUserData)
  var objectCanDeselect = new UIStyledCheckbox(true)
    .setIdFor("objectCanDeselect")
    .onChange(updateUserData)
  objectCanSelectRow.add(new UIText(strings.getKey("sidebar/object/selectable/canSelect")))
  objectCanSelectRow.add(objectCanSelect)
  objectCanSelectRow.add(new UIText(strings.getKey("sidebar/object/selectable/canDeselect")))
  objectCanSelectRow.add(objectCanDeselect)

  var objectDragTypeRow = new UIRow()
  var objectDragType = new UIDropdown()
    .setOptions({ none: "None", move: "Move", rotate: "Rotate", transform: "Transform handles" })
    .onChange(selectableSelectChanged)
  objectDragTypeRow.add(new UIText(strings.getKey("sidebar/object/selectable/drag")))
  objectDragTypeRow.add(objectDragType)

  var objectSelectableHandleShowRow = new UIRow()
  var objectSelectableHandleShow = new UIDropdown()
    .setOptions({ "when selected": "when selected", always: "always" })
    .onChange(selectableSelectChanged)
  objectSelectableHandleShowRow.add(
    new UIText(strings.getKey("sidebar/object/selectable/show")).setMarginLeft("10px")
  )
  objectSelectableHandleShowRow.add(objectSelectableHandleShow)

  var objectSelectableAxisRow = new UIRow()
  var objectSelectableAxis = {}
  objectSelectableAxisRow.add(
    new UIText(strings.getKey("sidebar/object/selectable/axis")).setMarginLeft("10px")
  )
    ;["x", "y", "z"].map((axis) => {
      objectSelectableAxis[axis] = new UIStyledCheckbox(true)
        .setMarginRight("5px")
        .setIdFor(`objectSelectable-${axis}Enabled`)
        .onChange(updateUserData)
      objectSelectableAxisRow.add(objectSelectableAxis[axis])
      objectSelectableAxisRow.add(
        new UIText(strings.getKey("sidebar/object/movement/" + axis)).setMarginRight("10px")
      )
    })

  var objectSelectableTransformRow = new UIDiv()
  var objectSelectableTransform = {}
  selectableKeys.map((key) => {
    var row = new UIRow()
    objectSelectableTransform[key] = new UIInput().onChange(updateUserData)
    row.add(
      new UIText(strings.getKey("sidebar/object/selectable/transform/" + key)).setMarginLeft("10px")
    )
    row.add(objectSelectableTransform[key])
    objectSelectableTransformRow.add(row)
  })

  objectSelectableAccordion.addToBody(objectSelectedRow)
  objectSelectableAccordion.addToBody(objectCanSelectRow)
  objectSelectableAccordion.addToBody(objectDragTypeRow)
  objectSelectableAccordion.addToBody(objectSelectableHandleShowRow)
  objectSelectableAccordion.addToBody(objectSelectableAxisRow)
  objectSelectableAccordion.addToBody(objectSelectableTransformRow)

  container.add(objectSelectableAccordion)

  // Spacial

  var objectSpacialAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/spacial"))
    .setId("spacial")
  var objectSpacials = {}
  var objectSpacialRows = {}
  var objectSpacialConnections = {}

    ;["position", "rotation", "scale"].map((spacial) => {
      objectSpacialRows[spacial] = new UIRow()
      objectSpacialRows[spacial].add(new UIText(strings.getKey("sidebar/object/" + spacial)))
      objectSpacials[spacial] = {}
        ;["x", "y", "z"].map((axis) => {
          objectSpacials[spacial][axis] = {}
          objectSpacials[spacial][axis]["label"] = new UIText(
            strings.getKey("sidebar/object/movement/" + axis)
          ).onClick(updateSpacialConnectionRows.bind(this, spacial, axis))
          objectSpacials[spacial][axis]["label"].addClass("connectionLabel")
          objectSpacials[spacial][axis]["value"] = new UINumber().setPrecision(3).onChange(update)

          objectSpacialRows[spacial].add(
            objectSpacials[spacial][axis]["label"],
            objectSpacials[spacial][axis]["value"]
          )
        })

      objectSpacialConnections[spacial] = new SidebarObjectConnection(editor, spacial)
      objectSpacialConnections[spacial].onChange(function (e) {
        var object = editor.selected

        if (!object.userData.connection) {
          object.userData.connection = {}
        }

        if (e.enabled) {
          if (!object.userData.connection[spacial]) {
            object.userData.connection[spacial] = {}
          }

          object.userData.connection[spacial][e.axis] = {}
          object.userData.connection[spacial][e.axis]["mouse"] = e.mouse
          object.userData.connection[spacial][e.axis]["speed"] = e.speed
          object.userData.connection[spacial][e.axis]["value"] = object[spacial][e.axis]
        } else {
          delete object.userData.connection[spacial][e.axis]
        }

        updateConnectionUI(object)

        editor.execute(new SetValueCommand(editor, object, "userData", object.userData))
      })

      objectSpacialAccordion.addToBody(objectSpacialRows[spacial])
      objectSpacialAccordion.addToBody(objectSpacialConnections[spacial])
    })

  // width

  var objectWidthRow = new UIRow()
  var objectWidth = new UINumber().onChange(update)

  objectWidthRow.add(new UIText(strings.getKey("sidebar/object/width")).setWidth("90px"))
  objectWidthRow.add(objectWidth)

  objectSpacialAccordion.addToBody(objectWidthRow)

  // height

  var objectHeightRow = new UIRow()
  var objectHeight = new UINumber().onChange(update)

  objectHeightRow.add(new UIText(strings.getKey("sidebar/object/height")).setWidth("90px"))
  objectHeightRow.add(objectHeight)

  objectSpacialAccordion.addToBody(objectHeightRow)

  container.add(objectSpacialAccordion)

  var objectLimitAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/object/movement/limit"))
    .setId("limit")

  var newCustomLimitRow = new UIRow().onClick(function () {
    limitDropdownRow.setDisplay("")
  })
  newCustomLimitRow.add(new UIText(strings.getKey("sidebar/object/movement/limit/create")))
  newCustomLimitRow.add(new UIText("+"))
  objectLimitAccordion.addToBody(newCustomLimitRow)

  var limitDropdownRow = new UIRow()
  var limitDropdown = new UIDropdown()
  limitDropdown.onChange(function (e) {
    var object = editor.selected
    var id = this.getValue()
    var name = this.getLabel()
    var newLimit = {
      type: id.search("tag/") == -1 ? "object" : "tag",
      uuid: id,
      name: name,
      enabled: true,
    }

    if (!object.userData.movement) object.userData.movement = {}
    if (!object.userData.movement.customLimit) object.userData.movement.customLimit = []

    object.userData.movement.customLimit.push(newLimit)

    updateCustsomLimitUI(object)
    updateUserData()
  })

  limitDropdownRow.add(new UIText(" "))
  limitDropdownRow.add(limitDropdown)

  objectLimitAccordion.addToBody(limitDropdownRow)

  var customLimits = new UIDiv()
  objectLimitAccordion.addToBody(customLimits)

    ;["positionLimit", "rotationLimit", "scaleLimit"].map((t) => {
      objectMovement[t] = {}
      objectMovementRows[t] = new UIDiv()

        ;["X", "Y", "Z"].map((axis) => {
          objectMovement[t][axis + "Enabled"] = new UIStyledCheckbox(true)
            .setIdFor(t + axis + "Enabled")
            .onChange(updateUserData)
          objectMovement[t][axis + "Min"] = new UINumber().onChange(updateUserData)
          objectMovement[t][axis + "Max"] = new UINumber().onChange(updateUserData)

          var row = new UIRow()
          row.add(new UIText(strings.getKey("sidebar/object/movement/" + t + axis)))
          row.add(
            objectMovement[t][axis + "Enabled"],
            objectMovement[t][axis + "Min"],
            objectMovement[t][axis + "Max"]
          )
          objectMovementRows[t].add(row)
        })

      objectLimitAccordion.addToBody(objectMovementRows[t])
    })

  container.add(objectLimitAccordion)

  // Lens

  var objectConnections = {}
  var objectLabels = {}
  var objectLensAccordion = new UIAccordion().setTitle(strings.getKey("sidebar/lens")).setId("lens")

  // fov

  var objectFovRow = new UIRow()
  var objectFov = new UINumber().onChange(update)

  objectLabels["Fov"] = new UIText(strings.getKey("sidebar/object/fov")).onClick(
    updateConnectionRows.bind(this, "fov")
  )
  objectFovRow.add(objectLabels["Fov"])
  objectFovRow.add(objectFov)

  objectConnections["fov"] = new SidebarObjectConnection(editor, "fov")
  objectConnections["fov"].onChange(updateConnectionValues.bind(this, "fov"))

  objectLensAccordion.addToBody(objectFovRow)
  objectLensAccordion.addToBody(objectConnections["fov"])

  // left

  var objectLeftRow = new UIRow()
  var objectLeft = new UINumber().onChange(update)

  objectLeftRow.add(new UIText(strings.getKey("sidebar/object/left")))
  objectLeftRow.add(objectLeft)

  objectLensAccordion.addToBody(objectLeftRow)

  // right

  var objectRightRow = new UIRow()
  var objectRight = new UINumber().onChange(update)

  objectRightRow.add(new UIText(strings.getKey("sidebar/object/right")))
  objectRightRow.add(objectRight)

  objectLensAccordion.addToBody(objectRightRow)

  // top

  var objectTopRow = new UIRow()
  var objectTop = new UINumber().onChange(update)

  objectTopRow.add(new UIText(strings.getKey("sidebar/object/top")))
  objectTopRow.add(objectTop)

  objectLensAccordion.addToBody(objectTopRow)

  // bottom

  var objectBottomRow = new UIRow()
  var objectBottom = new UINumber().onChange(update)

  objectBottomRow.add(new UIText(strings.getKey("sidebar/object/bottom")))
  objectBottomRow.add(objectBottom)

  objectLensAccordion.addToBody(objectBottomRow)

  // near

  var objectNearRow = new UIRow()
  var objectNear = new UINumber().onChange(update)

  objectLabels["Near"] = new UIText(strings.getKey("sidebar/object/near")).onClick(
    updateConnectionRows.bind(this, "near")
  )
  objectNearRow.add(objectLabels["Near"])
  objectNearRow.add(objectNear)

  objectConnections["near"] = new SidebarObjectConnection(editor, "near")
  objectConnections["near"].onChange(updateConnectionValues.bind(this, "near"))

  objectLensAccordion.addToBody(objectNearRow)
  objectLensAccordion.addToBody(objectConnections["near"])

  // far

  var objectFarRow = new UIRow()
  var objectFar = new UINumber().onChange(update)

  objectLabels["Far"] = new UIText(strings.getKey("sidebar/object/far")).onClick(
    updateConnectionRows.bind(this, "far")
  )
  objectFarRow.add(objectLabels["Far"])
  objectFarRow.add(objectFar)

  objectConnections["far"] = new SidebarObjectConnection(editor, "far")
  objectConnections["far"].onChange(updateConnectionValues.bind(this, "far"))

  objectLensAccordion.addToBody(objectFarRow)
  objectLensAccordion.addToBody(objectConnections["far"])

  container.add(objectLensAccordion)

  // Styling

  var objectStylingAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/object/styling"))
    .setId("styling")

  // intensity

  var objectIntensityRow = new UIRow()
  var objectIntensity = new UINumber().onChange(update)

  objectLabels["Intensity"] = new UIText(strings.getKey("sidebar/object/intensity")).onClick(
    updateConnectionRows.bind(this, "intensity")
  )
  objectIntensityRow.add(objectLabels["Intensity"])
  objectIntensityRow.add(objectIntensity)

  objectConnections["intensity"] = new SidebarObjectConnection(editor, "intenstiy")
  objectConnections["intensity"].onChange(updateConnectionValues.bind(this, "intensity"))

  objectStylingAccordion.addToBody(objectIntensityRow)
  objectStylingAccordion.addToBody(objectConnections["intensity"])

  // color

  var objectColorRow = new UIRow()
  var objectColor = new UIColorPicker(editor).onChange(update)

  objectColorRow.add(new UIText(strings.getKey("sidebar/object/color")))
  objectColorRow.add(objectColor)

  objectStylingAccordion.addToBody(objectColorRow)

  // ground color

  var objectGroundColorRow = new UIRow()
  var objectGroundColor = new UIColorPicker(editor).onChange(update)

  objectGroundColorRow.add(new UIText(strings.getKey("sidebar/object/groundcolor")))
  objectGroundColorRow.add(objectGroundColor)

  objectStylingAccordion.addToBody(objectGroundColorRow)

  // distance

  var objectDistanceRow = new UIRow()
  var objectDistance = new UINumber().setRange(0, Infinity).onChange(update)

  objectDistanceRow.add(new UIText(strings.getKey("sidebar/object/distance")))
  objectDistanceRow.add(objectDistance)

  objectStylingAccordion.addToBody(objectDistanceRow)

  // angle

  var objectAngleRow = new UIRow()
  var objectAngle = new UINumber()
    .setPrecision(3)
    .setRange(0, Math.PI / 2)
    .onChange(update)

  objectAngleRow.add(new UIText(strings.getKey("sidebar/object/angle")))
  objectAngleRow.add(objectAngle)

  objectStylingAccordion.addToBody(objectAngleRow)

  // penumbra

  var objectPenumbraRow = new UIRow()
  var objectPenumbra = new UINumber().setRange(0, 1).onChange(update)

  objectPenumbraRow.add(new UIText(strings.getKey("sidebar/object/penumbra")))
  objectPenumbraRow.add(objectPenumbra)

  objectStylingAccordion.addToBody(objectPenumbraRow)

  // decay

  var objectDecayRow = new UIRow()
  var objectDecay = new UINumber().setRange(0, Infinity).onChange(update)

  objectDecayRow.add(new UIText(strings.getKey("sidebar/object/decay")))
  objectDecayRow.add(objectDecay)

  objectStylingAccordion.addToBody(objectDecayRow)

  // focus

  var objectFocusRow = new UIRow()
  var objectFocus = new UINumber().setRange(0, 1).onChange(update)

  objectFocusRow.add(new UIText(strings.getKey("sidebar/object/focus")))
  objectFocusRow.add(objectFocus)

  objectStylingAccordion.addToBody(objectFocusRow)

  // Particle

  var particleStylingDiv = new UIDiv()

  var particleTextureRow = new UIRow()
  var particleTexture = new UITexture(editor).onChange(function (textureId) {
    editor.execute(new SetParticleValueCommand(editor, editor.selected, "", "textureId", textureId))
  })

  particleTextureRow.add(new UIText(strings.getKey("sidebar/particle/texture")))
  particleTextureRow.add(particleTexture)

  particleStylingDiv.add(particleTextureRow)

  var particleCountRow = new UIRow()
  var particleCount = new UINumber().setRange(0, Infinity).onChange(update)

  particleCountRow.add(new UIText(strings.getKey("sidebar/particle/count")))
  particleCountRow.add(particleCount)

  particleStylingDiv.add(particleCountRow)

  var particleBlendModeRow = new UIRow()
  var particleBlendMode = new UIDropdown()
    .setOptions({
      0: "None",
      1: "Normal",
      2: "Additive",
      3: "Subtractive",
      4: "Multiply",
    })
    .onChange(update)

  particleBlendModeRow.add(new UIText(strings.getKey("sidebar/particle/blend_mode")))
  particleBlendModeRow.add(particleBlendMode)

  particleStylingDiv.add(particleBlendModeRow)

  var particleDirectionRow = new UIRow()
  var particleDirection = new UIDropdown()
    .setOptions({
      1: "Forward",
      "-1": "Backward",
    })
    .onChange(update)

  particleDirectionRow.add(new UIText(strings.getKey("sidebar/particle/direction")))
  particleDirectionRow.add(particleDirection)

  particleStylingDiv.add(particleDirectionRow)

  var particleRateRow = new UIRow()
  var particleRate = new UINumber().setRange(0, Infinity).onChange(update)

  particleRateRow.add(new UIText(strings.getKey("sidebar/particle/rate")))
  particleRateRow.add(particleRate)

  particleStylingDiv.add(particleRateRow)

  var particleDurationRow = new UIRow()
  var particleDuration = new UINumber().setRange(0, Infinity).onChange(update)

  particleDurationRow.add(new UIText(strings.getKey("sidebar/particle/duration")))
  particleDurationRow.add(particleDuration)

  particleStylingDiv.add(particleDurationRow)

  var particleEmitterTypeRow = new UIRow()
  var particleEmitterType = new UIDropdown()
    .setOptions({
      1: "Box",
      2: "Sphere",
      3: "Disc",
    })
    .onChange(update)

  particleEmitterTypeRow.add(new UIText(strings.getKey("sidebar/particle/direction")))
  particleEmitterTypeRow.add(particleEmitterType)

  particleStylingDiv.add(particleEmitterTypeRow)

  var particleAgeRow = new UIRow()
  var particleAgeFSpan = new UISpan()
  var particleAgeF = new UINumber().setRange(0, Infinity).onChange(update)
  var particleAgePlusMinusSpan = new UISpan()
  var particleAgePlusMinus = new UINumber().setRange(0, Infinity).onChange(update)

  particleAgeFSpan.add(new UIText(strings.getKey("sidebar/particle/f")))
  particleAgeFSpan.add(particleAgeF)

  particleAgePlusMinusSpan.add(new UIText(strings.getKey("sidebar/particle/plus_minus")))
  particleAgePlusMinusSpan.add(particleAgePlusMinus)

  particleAgeRow.add(
    new UIText(strings.getKey("sidebar/particle/age")),
    particleAgeFSpan,
    particleAgePlusMinusSpan
  )

  particleStylingDiv.add(particleAgeRow)

  var particleSpeed = {}

    ;["position", "velocity", "acceleration"].map((t) => {
      particleSpeed[t] = {}

      var row = new UIRow()
      row.add(new UIText(strings.getKey("sidebar/particle/" + t)))
      row.setBackgroundColor("rgba(49, 56, 75, 0.26)")

      particleStylingDiv.add(row)

        ;["initial", "variation"].map((s) => {
          var speedRow = new UIRow()
          speedRow.add(new UIText(strings.getKey("sidebar/particle/" + s)))

          particleSpeed[t][s] = {}

            ;["x", "y", "z"].map((x) => {
              particleSpeed[t][s][x] = new UINumber().setRange(0, Infinity).onChange(update)

              speedRow.add(new UIText(strings.getKey("sidebar/particle/" + x)))
              speedRow.add(particleSpeed[t][s][x])
            })

          particleStylingDiv.add(speedRow)
        })
    })

  var particleWiggleRow = new UIRow()
  var particleWiggleFSpan = new UISpan()
  var particleWiggleF = new UINumber().setRange(0, Infinity).onChange(update)
  var particleWigglePlusMinusSpan = new UISpan()
  var particleWigglePlusMinus = new UINumber().setRange(0, Infinity).onChange(update)

  particleWiggleFSpan.add(new UIText(strings.getKey("sidebar/particle/f")))
  particleWiggleFSpan.add(particleWiggleF)

  particleWigglePlusMinusSpan.add(new UIText(strings.getKey("sidebar/particle/plus_minus")))
  particleWigglePlusMinusSpan.add(particleWigglePlusMinus)

  particleWiggleRow.add(
    new UIText(strings.getKey("sidebar/particle/wiggle")),
    particleWiggleFSpan,
    particleWigglePlusMinusSpan
  )

  particleStylingDiv.add(particleWiggleRow)

  var particleOpacityDiv = new UIDiv().setClass("GraphWrapper")

  var particleOpacityLabelRow = new UIRow().setBorder("none")
  particleOpacityLabelRow.add(new UIText(strings.getKey("sidebar/particle/opacity")))

  var particleOpacity = new UIGraph("particleOpacity", "#6c8db8")
  particleOpacity.setOnChange(function () {
    editor.execute(
      new SetParticleValueCommand(
        editor,
        editor.selected,
        "emitter.opacity",
        "value",
        particleOpacity.getValue()
      )
    )
  })
  particleOpacity.addGraph("spread", "#41546d")
  particleOpacity.setOnChange(function () {
    editor.execute(
      new SetParticleValueCommand(
        editor,
        editor.selected,
        "emitter.opacity",
        "spread",
        particleOpacity.getValue("spread")
      )
    )
  }, "spread")

  particleOpacityDiv.add(particleOpacityLabelRow, particleOpacity)

  particleStylingDiv.add(particleOpacityDiv)

  var particleScaleDiv = new UIDiv().setClass("GraphWrapper")

  var particleScaleSizeRow = new UIRow().setBorder("none")
  var particleScaleSizeMin = new UISpan()
  var particleScaleSizeMax = new UISpan()
  var particleScaleMin = new UINumber().setRange(0, Infinity).onChange(function () {
    particleScale.setRange(particleScaleMin.getValue(), particleScaleMax.getValue())
  })
  var particleScaleMax = new UINumber().setRange(0, Infinity).onChange(function () {
    particleScale.setRange(particleScaleMin.getValue(), particleScaleMax.getValue())
  })

  particleScaleSizeMin.add(new UIText(strings.getKey("sidebar/particle/min")), particleScaleMin)
  particleScaleSizeMax.add(new UIText(strings.getKey("sidebar/particle/max")), particleScaleMax)

  particleScaleSizeRow.add(
    new UIText(strings.getKey("sidebar/particle/scale")),
    particleScaleSizeMin,
    particleScaleSizeMax
  )

  var particleScale = new UIGraph("particleScale", "#6c8db8")
  particleScale.setOnChange(function () {
    // editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.size', 'value', particleScale.getValue() ) );
  })
  particleScale.addGraph("spread", "#41546d")
  particleScale.setOnChange(function () {
    // editor.execute( new SetParticleValueCommand( editor, editor.selected, 'emitter.size', 'spread', particleScale.getValue( 'spread' ) ) );
  }, "spread")

  particleScaleDiv.add(particleScaleSizeRow, particleScale)

  particleStylingDiv.add(particleScaleDiv)

  var particleRotationDiv = new UIDiv().setClass("GraphWrapper")

  var particleRotationAngleRow = new UIRow().setBorder("none")
  var particleRotationAngleMin = new UISpan()
  var particleRotationAngleMax = new UISpan()
  var particleRotationMin = new UINumber().setRange(0, Infinity).onChange(function () {
    particleRotation.setRange(particleRotationMin.getValue(), particleRotationMax.getValue())
  })
  var particleRotationMax = new UINumber().setRange(0, Infinity).onChange(function () {
    particleRotation.setRange(particleRotationMin.getValue(), particleRotationMax.getValue())
  })

  particleRotationAngleMin.add(
    new UIText(strings.getKey("sidebar/particle/min")),
    particleRotationMin
  )
  particleRotationAngleMax.add(
    new UIText(strings.getKey("sidebar/particle/max")),
    particleRotationMax
  )

  particleRotationAngleRow.add(
    new UIText(strings.getKey("sidebar/particle/rotation")),
    particleRotationAngleMin,
    particleRotationAngleMax
  )

  var particleRotation = new UIGraph("particleRotation", "#6c8db8")
  particleRotation.setOnChange(function () {
    editor.execute(
      new SetParticleValueCommand(
        editor,
        editor.selected,
        "emitter.angle",
        "value",
        particleRotation.getValue()
      )
    )
  })
  particleRotation.addGraph("spread", "#41546d")
  particleRotation.setOnChange(function () {
    editor.execute(
      new SetParticleValueCommand(
        editor,
        editor.selected,
        "emitter.angle",
        "spread",
        particleRotation.getValue("spread")
      )
    )
  }, "spread")

  particleRotationDiv.add(particleRotationAngleRow, particleRotation)

  particleStylingDiv.add(particleRotationDiv)

  var particleColorRow = new UIRow()
  particleColorRow.add(new UIText(strings.getKey("sidebar/particle/color")))
  particleColorRow.setBackgroundColor("rgba(49, 56, 75, 0.26)")

  particleStylingDiv.add(particleColorRow)

  var particleBaseColorRow = new UIRow()
  var particleBaseColor = new UIColorGradientChooser()
  particleBaseColor.setOnChange(function (color, index) {
    editor.execute(
      new SetParticleValueCommand(editor, editor.selected, "emitter.color.value", index, color)
    )
  })
  particleBaseColorRow.add(new UIText(strings.getKey("sidebar/particle/color/base")))
  particleBaseColorRow.add(particleBaseColor)

  particleStylingDiv.add(particleBaseColorRow)

  var particleSpreadColorRow = new UIRow()
  var particleSpreadColor = new UIColorGradientChooser()
  particleSpreadColor.setOnChange(function (color, index) {
    editor.execute(
      new SetParticleValueCommand(
        editor,
        editor.selected,
        "emitter.color.spread",
        index,
        new THREE.Vector3(color.r, color.g, color.b)
      )
    )
  })
  particleSpreadColorRow.add(new UIText(strings.getKey("sidebar/particle/color/spread")))
  particleSpreadColorRow.add(particleSpreadColor)

  particleStylingDiv.add(particleSpreadColorRow)

  objectStylingAccordion.addToBody(particleStylingDiv)

  container.add(objectStylingAccordion)

  // Render

  var objectRenderAccordion = new UIAccordion()
    .setTitle(strings.getKey("sidebar/render"))
    .setId("render")

  // shadow

  var objectCastShadowRow = new UIRow()
  var objectCastShadow = new UIStyledCheckbox().setIdFor("objectCastShadow").onChange(update)

  objectCastShadowRow.add(new UIText(strings.getKey("sidebar/object/cast")))
  objectCastShadowRow.add(objectCastShadow)

  objectRenderAccordion.addToBody(objectCastShadowRow)

  // advansed helper for the directional light

  var objectAdvancedHelperRow = new UIRow()
  var objectAdvancedHelper = new UIStyledCheckbox()
    .setIdFor("objectAdvancedHelper2")
    .onChange(update)

  objectAdvancedHelperRow.add(new UIText(strings.getKey("sidebar/object/advanced_helper")))
  objectAdvancedHelperRow.add(objectAdvancedHelper)

  objectRenderAccordion.addToBody(objectAdvancedHelperRow)

  // receive shadow

  var objectReceiveShadowRow = new UIRow()
  var objectReceiveShadow = new UIStyledCheckbox().setIdFor("objectReceiveShadow").onChange(update)

  objectReceiveShadowRow.add(new UIText(strings.getKey("sidebar/object/receive")))
  objectReceiveShadowRow.add(objectReceiveShadow)

  objectRenderAccordion.addToBody(objectReceiveShadowRow)

  // shadow bias

  var objectShadowBiasRow = new UIRow()

  objectShadowBiasRow.add(new UIText(strings.getKey("sidebar/object/shadowBias")).setWidth("90px"))

  var objectShadowBias = new UINumber(0)
    .setPrecision(6)
    .setStep(0.001)
    .setNudge(0.000001)
    .onChange(update)
  objectShadowBiasRow.add(objectShadowBias)

  objectRenderAccordion.addToBody(objectShadowBiasRow)

  // shadow normal offset

  var objectShadowNormalBiasRow = new UIRow()

  objectShadowNormalBiasRow.add(
    new UIText(strings.getKey("sidebar/object/shadowNormalBias")).setWidth("90px")
  )

  var objectShadowNormalBias = new UINumber(0).onChange(update)
  objectShadowNormalBiasRow.add(objectShadowNormalBias)

  objectRenderAccordion.addToBody(objectShadowBiasRow)

  // shadow radius

  var objectShadowRadiusRow = new UIRow()

  objectShadowRadiusRow.add(
    new UIText(strings.getKey("sidebar/object/shadowRadius")).setWidth("90px")
  )

  var objectShadowRadius = new UINumber(1).onChange(update)
  objectShadowRadiusRow.add(objectShadowRadius)

  objectRenderAccordion.addToBody(objectShadowRadiusRow)

  // var resolutionOptions = {
  // 	'32': 32,
  // 	'64': 64,
  // 	'128': 128,
  // 	'256': 256,
  // 	'512': 512,
  // 	'1024': 1024,
  // 	'2048': 2048,
  // 	'4096': 4096,
  // 	'8192': 8192,
  // };

  var shadowCameraDiv = new UIDiv()

  var shadowCameraWidthRow = new UIRow()

  shadowCameraWidthRow.add(new UIText(strings.getKey("sidebar/object/width")).setWidth("90px"))

  var shadowCameraWidth = new UINumber().onChange(update)
  shadowCameraWidthRow.add(shadowCameraWidth)

  shadowCameraDiv.add(shadowCameraWidthRow)

  var shadowCameraHeightRow = new UIRow()

  shadowCameraHeightRow.add(new UIText(strings.getKey("sidebar/object/height")).setWidth("90px"))

  var shadowCameraHeight = new UINumber().onChange(update)
  shadowCameraHeightRow.add(shadowCameraHeight)

  shadowCameraDiv.add(shadowCameraHeightRow)

  var shadowCameraNearRow = new UIRow()

  shadowCameraNearRow.add(new UIText(strings.getKey("sidebar/object/near")).setWidth("90px"))

  var shadowCameraNear = new UINumber().onChange(update)
  shadowCameraNearRow.add(shadowCameraNear)

  shadowCameraDiv.add(shadowCameraNearRow)

  var shadowCameraFarRow = new UIRow()

  shadowCameraFarRow.add(new UIText(strings.getKey("sidebar/object/far")).setWidth("90px"))

  var shadowCameraFar = new UINumber().onChange(update)
  shadowCameraFarRow.add(shadowCameraFar)

  shadowCameraDiv.add(shadowCameraFarRow)

  var shadowCameraZoomRow = new UIRow()

  shadowCameraZoomRow.add(
    new UIText(strings.getKey("sidebar/object/movement/controller/zoom")).setWidth("90px")
  )

  var shadowCameraZoom = new UINumber().setRange(0, 1.5).onChange(update)
  shadowCameraZoomRow.add(shadowCameraZoom)

  shadowCameraDiv.add(shadowCameraZoomRow)

  // var shadowCameraResolutionWidthRow = new UIRow();

  // shadowCameraResolutionWidthRow.add( new UIText( strings.getKey( 'sidebar/object/resolution_width' ) ).setWidth( '105px' ) );

  // var shadowCameraResolutionWidth = new UIDropdown().setOptions( resolutionOptions ).onChange( update );
  // shadowCameraResolutionWidthRow.add( shadowCameraResolutionWidth );

  // shadowCameraDiv.add( shadowCameraResolutionWidthRow );

  // var shadowCameraResolutionHeightRow = new UIRow();

  // shadowCameraResolutionHeightRow.add( new UIText( strings.getKey( 'sidebar/object/resolution_height' ) ).setWidth( '105px' ) );

  // var shadowCameraResolutionHeight = new UIDropdown().setOptions( resolutionOptions ).onChange( update );
  // shadowCameraResolutionHeightRow.add( shadowCameraResolutionHeight );

  // shadowCameraDiv.add( shadowCameraResolutionHeightRow );

  objectRenderAccordion.addToBody(shadowCameraDiv)

  // visible

  var objectVisibleRow = new UIRow()
  var objectVisible = new UIStyledCheckbox().setIdFor("objectVisible").onChange(update)

  objectVisibleRow.add(new UIText(strings.getKey("sidebar/object/visible")))
  objectVisibleRow.add(objectVisible)

  objectRenderAccordion.addToBody(objectVisibleRow)

  // axes helper

  var objectAxesHelperRow = new UIRow()
  var objectAxesHelper = new UIStyledCheckbox().setIdFor("objectAxesHelper").onChange(update)
  var objectAxesHelperValue = new UINumber(1).setRange(0, 100).setPrecision(1).onChange(update)
  var objectAxesHelperRowInitiated = false;

  objectAxesHelperRow.add(new UIText(strings.getKey("sidebar/object/axes")))
  objectAxesHelperRow.add(objectAxesHelperValue)
  objectAxesHelperRow.add(objectAxesHelper)

  objectRenderAccordion.addToBody(objectAxesHelperRow)

  container.add(objectRenderAccordion)

  //

  function update() {
    var object = editor.selected

    if (object !== null) {
      var newPosition = new THREE.Vector3(
        objectSpacials.position.x.value.getValue(),
        objectSpacials.position.y.value.getValue(),
        objectSpacials.position.z.value.getValue()
      )
      if (object.position.distanceTo(newPosition) >= 0.01) {
        editor.execute(new SetPositionCommand(editor, object, newPosition))
      }

      var newRotation = new THREE.Euler(
        objectSpacials.rotation.x.value.getValue() * THREE.MathUtils.DEG2RAD,
        objectSpacials.rotation.y.value.getValue() * THREE.MathUtils.DEG2RAD,
        objectSpacials.rotation.z.value.getValue() * THREE.MathUtils.DEG2RAD
      )
      var objectRotation = new THREE.Vector3()
      var objectNewRotation = new THREE.Vector3()
      if (
        objectRotation
          .setFromEuler(object.rotation)
          .distanceTo(objectNewRotation.setFromEuler(newRotation)) >= 0.01
      ) {
        editor.execute(new SetRotationCommand(editor, object, newRotation))
      }

      var newScale = new THREE.Vector3(
        objectSpacials.scale.x.value.getValue(),
        objectSpacials.scale.y.value.getValue(),
        objectSpacials.scale.z.value.getValue()
      )
      if (object.scale.distanceTo(newScale) >= 0.01) {
        editor.execute(new SetScaleCommand(editor, object, newScale))
      }

      if (object.width !== undefined && Math.abs(object.width - objectWidth.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "width", objectWidth.getValue()))
      }

      if (
        object.height !== undefined &&
        Math.abs(object.height - objectHeight.getValue()) >= 0.01
      ) {
        editor.execute(new SetValueCommand(editor, object, "height", objectHeight.getValue()))
      }

      if (object.fov !== undefined && Math.abs(object.fov - objectFov.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "fov", objectFov.getValue()))
        object.updateProjectionMatrix()
      }

      if (object.left !== undefined && Math.abs(object.left - objectLeft.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "left", objectLeft.getValue()))
        object.updateProjectionMatrix()
      }

      if (object.right !== undefined && Math.abs(object.right - objectRight.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "right", objectRight.getValue()))
        object.updateProjectionMatrix()
      }

      if (object.top !== undefined && Math.abs(object.top - objectTop.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "top", objectTop.getValue()))
        object.updateProjectionMatrix()
      }

      if (
        object.bottom !== undefined &&
        Math.abs(object.bottom - objectBottom.getValue()) >= 0.01
      ) {
        editor.execute(new SetValueCommand(editor, object, "bottom", objectBottom.getValue()))
        object.updateProjectionMatrix()
      }

      if (object.near !== undefined && Math.abs(object.near - objectNear.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "near", objectNear.getValue()))
        if (object.isOrthographicCamera) {
          object.updateProjectionMatrix()
        }
      }

      if (object.far !== undefined && Math.abs(object.far - objectFar.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "far", objectFar.getValue()))
        if (object.isOrthographicCamera) {
          object.updateProjectionMatrix()
        }
      }

      if (
        object.intensity !== undefined &&
        Math.abs(object.intensity - objectIntensity.getValue()) >= 0.01
      ) {
        editor.execute(new SetValueCommand(editor, object, "intensity", objectIntensity.getValue()))
      }

      if (object.color !== undefined && object.color.getHex() !== objectColor.getHexValue()) {
        editor.execute(new SetColorCommand(editor, object, "color", objectColor.getHexValue()))
      }

      if (
        object.groundColor !== undefined &&
        object.groundColor.getHex() !== objectGroundColor.getHexValue()
      ) {
        editor.execute(
          new SetColorCommand(editor, object, "groundColor", objectGroundColor.getHexValue())
        )
      }

      if (
        object.distance !== undefined &&
        Math.abs(object.distance - objectDistance.getValue()) >= 0.01
      ) {
        editor.execute(new SetValueCommand(editor, object, "distance", objectDistance.getValue()))
      }

      if (object.angle !== undefined && Math.abs(object.angle - objectAngle.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "angle", objectAngle.getValue()))
      }

      if (
        object.penumbra !== undefined &&
        Math.abs(object.penumbra - objectPenumbra.getValue()) >= 0.01
      ) {
        editor.execute(new SetValueCommand(editor, object, "penumbra", objectPenumbra.getValue()))
      }

      if (object.decay !== undefined && Math.abs(object.decay - objectDecay.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object, "decay", objectDecay.getValue()))
      }

      if (object.isSpotLight && Math.abs(object.shadow.focus - objectFocus.getValue()) >= 0.01) {
        editor.execute(new SetValueCommand(editor, object.shadow, "focus", objectFocus.getValue()))
      }

      if (object.visible !== objectVisible.getValue()) {
        //editor.execute( new SetValueCommand( editor, object, 'visible', objectVisible.getValue() ) );
        editor.execute(new SetVisibleCommand(editor, object, objectVisible.getValue()))
      }
      if (object.axesHelper !== objectAxesHelper.getValue()) {
        editor.execute(new SetValueCommand(editor, object, "axesHelper", objectAxesHelper.getValue()))
      }


      if (object.axesHelperSize !== objectAxesHelperValue.getValue()) {
        editor.execute(new SetValueCommand(editor, object, "axesHelperSize", objectAxesHelperValue.getValue()))
      }


      // axes helper
      if (objectAxesHelper.getValue()) {
        if (object.axesHelperChild === undefined) {
          object.axesHelperChild = new THREE.AxesHelper(objectAxesHelperValue.getValue())
          // object.axesHelperChild.scale.set(
          //   objectAxesHelperValue.getValue(),
          //   objectAxesHelperValue.getValue(),
          //   objectAxesHelperValue.getValue()
          // )
          // object.axesHelperChild.material.depthTest = false
          // object.axesHelperChild.renderOrder = 2
          object.axesHelperChild.name = "AxesHelperEngineTool"
          object.add(object.axesHelperChild)
        } else {
          object.axesHelperChild.scale.set(
            objectAxesHelperValue.getValue(),
            objectAxesHelperValue.getValue(),
            objectAxesHelperValue.getValue()
          )
        }
      } else {
        if (object.axesHelperChild !== undefined) {
          object.remove(object.axesHelperChild)
          object.axesHelperChild = undefined
        }
      }

      if (object.castShadow !== objectCastShadow.getValue()) {
        editor.execute(
          new SetValueCommand(editor, object, "castShadow", objectCastShadow.getValue())
        )
      }

      if (object.userData.advancedHelper !== objectAdvancedHelper.getValue()) {
        editor.execute(
          new SetAdvancedHelperCommand(editor, object, objectAdvancedHelper.getValue())
        )
      }

      if (
        object.receiveShadow !== undefined &&
        object.receiveShadow !== objectReceiveShadow.getValue()
      ) {
        if (object.material !== undefined) object.material.needsUpdate = true
        editor.execute(
          new SetValueCommand(editor, object, "receiveShadow", objectReceiveShadow.getValue())
        )
      }

      if (object.shadow !== undefined) {
        if (object.shadow.bias !== objectShadowBias.getValue()) {
          editor.execute(
            new SetValueCommand(editor, object.shadow, "bias", objectShadowBias.getValue())
          )
        }

        if (object.shadow.radius !== objectShadowRadius.getValue()) {
          editor.execute(
            new SetValueCommand(editor, object.shadow, "radius", objectShadowRadius.getValue())
          )
        }

        if (object.shadow.normalBias !== objectShadowNormalBias.getValue()) {
          editor.execute(
            new SetValueCommand(
              editor,
              object.shadow,
              "normalBias",
              objectShadowNormalBias.getValue()
            )
          )
        }
      }

      if (object.isDirectionalLight) {
        if (object.shadow.camera.right * 2 !== shadowCameraWidth.getValue()) {
          editor.execute(
            new SetValueCommand(
              editor,
              object.shadow.camera,
              "left",
              shadowCameraWidth.getValue() / -2
            )
          )
          editor.execute(
            new SetValueCommand(
              editor,
              object.shadow.camera,
              "right",
              shadowCameraWidth.getValue() / 2
            )
          )
        }

        if (object.shadow.camera.top * 2 !== shadowCameraHeight.getValue()) {
          editor.execute(
            new SetValueCommand(
              editor,
              object.shadow.camera,
              "bottom",
              shadowCameraHeight.getValue() / -2
            )
          )
          editor.execute(
            new SetValueCommand(
              editor,
              object.shadow.camera,
              "top",
              shadowCameraHeight.getValue() / 2
            )
          )
        }

        if (object.shadow.camera.near !== shadowCameraNear.getValue()) {
          editor.execute(
            new SetValueCommand(editor, object.shadow.camera, "near", shadowCameraNear.getValue())
          )
        }

        if (object.shadow.camera.far !== shadowCameraFar.getValue()) {
          editor.execute(
            new SetValueCommand(editor, object.shadow.camera, "far", shadowCameraFar.getValue())
          )
        }

        if (object.shadow.camera.zoom !== shadowCameraZoom.getValue()) {
          editor.execute(
            new SetValueCommand(editor, object.shadow.camera, "zoom", shadowCameraZoom.getValue())
          )
        }

        // if ( object.shadow.mapSize.width !== shadowCameraResolutionWidth.getValue() ) {

        // 	editor.execute( new SetValueCommand( editor, object.shadow.mapSize, 'width', shadowCameraResolutionWidth.getValue() ) );

        // }

        // if ( object.shadow.mapSize.height !== shadowCameraResolutionHeight.getValue() ) {

        // 	editor.execute( new SetValueCommand( editor, object.shadow.mapSize, 'height', shadowCameraResolutionHeight.getValue() ) );

        // }
      }

      if (object.type == "Particle") {
        if (Math.abs(object.group.maxParticleCount - particleCount.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "group",
              "maxParticleCount",
              particleCount.getValue()
            )
          )
        }

        if (Math.abs(object.group.blending - particleBlendMode.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "group",
              "blending",
              parseInt(particleBlendMode.getValue())
            )
          )
        }

        if (Math.abs(object.emitter.direction - particleDirection.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter",
              "direction",
              parseInt(particleDirection.getValue())
            )
          )
        }

        if (Math.abs(object.emitter.particleCount - particleRate.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter",
              "particleCount",
              particleRate.getValue()
            )
          )
        }

        if (
          object.emitter.duration &&
          Math.abs(object.emitter.duration - particleDuration.getValue()) >= 0.01
        ) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter",
              "duration",
              particleDuration.getValue()
            )
          )
        }

        if (Math.abs(object.emitter.type - particleEmitterType.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter",
              "type",
              parseInt(particleEmitterType.getValue())
            )
          )
        }

        if (Math.abs(object.emitter.maxAge.value - particleAgeF.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter.maxAge",
              "value",
              particleAgeF.getValue()
            )
          )
        }

        if (Math.abs(object.emitter.maxAge.spread - particleAgePlusMinus.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter.maxAge",
              "spread",
              particleAgePlusMinus.getValue()
            )
          )
        }

        ;["position", "velocity", "acceleration"].map((t) => {
          var newValue = new THREE.Vector3(
            particleSpeed[t].initial.x.getValue(),
            particleSpeed[t].initial.y.getValue(),
            particleSpeed[t].initial.z.getValue()
          )
          if (object.emitter[t].value.distanceTo(newValue) >= 0.01) {
            editor.execute(
              new SetParticleValueCommand(editor, object, "emitter." + t, "value", newValue)
            )
          }

          var newSpread = new THREE.Vector3(
            particleSpeed[t].variation.x.getValue(),
            particleSpeed[t].variation.y.getValue(),
            particleSpeed[t].variation.z.getValue()
          )
          if (object.emitter[t].spread.distanceTo(newSpread) >= 0.01) {
            editor.execute(
              new SetParticleValueCommand(editor, object, "emitter." + t, "spread", newSpread)
            )
          }
        })

        if (Math.abs(object.emitter.wiggle.value - particleWiggleF.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter.wiggle",
              "value",
              particleWiggleF.getValue()
            )
          )
        }

        if (Math.abs(object.emitter.wiggle.spread - particleWigglePlusMinus.getValue()) >= 0.01) {
          editor.execute(
            new SetParticleValueCommand(
              editor,
              object,
              "emitter.wiggle",
              "spread",
              particleWigglePlusMinus.getValue()
            )
          )
        }
      }
    }
  }

  function updateLookAtRows(_toUpdate = true){
    if(_toUpdate)
      updateUserData();
    lookAtDragRow.setDisplay(lookAtObjectUuid.getValue() == 'none' ? 'none' : '');
    axisEnabledRow.setDisplay((lookAtObjectUuid.getValue() == 'location' || lookAtObjectUuid.getValue() == 'none') ? 'none' : '');
    axisRow.setDisplay(lookAtObjectUuid.getValue() == 'location' ? '' : 'none');
  }

  function updateUserData() {
    var object = editor.selected

    if (object) {
      try {
        var userData = object.userData
        userData["movement"] = getMovementData(object)
        
        if (object.isMesh || object.isSprite) {
          userData["selectable"] = getSelectableData()
        }

        editor.execute(new SetValueCommand(editor, object, "userData", userData))
      } catch (exception) {
        console.warn(exception)
      }
    }
  }

  // function setValues(_object,_key){
  //   for (let id in _object) {
  //     if (id !== "rows") {

  //       let field =
  //         (_key == "direction" || _key == "rotation" || _key == "grow") && id.length == 1
  //           ? _object[id].value
  //           : _object[id]

        
  //         movement[_key][id] = field.getValue()

  //     }
  //   }
  // }

  // function getMovementData(_object) {
  //   var movement = {};
  //   const {isCamera} = _object;
  //   var controllerType = objectControllerType.getValue()

  //   if (_object.userData.movement && _object.userData.movement.customLimit) {
  //     movement.customLimit = _object.userData.movement.customLimit
  //   }

  //   // let object;

  //   for (var key in objectMovement) {
      
  //     movement[key] = {}

  //     // let object =
  //     //   key == "controller" ? objectMovement.controller[controllerType] : objectMovement[key]

  //       // if (key == "controller") 
        
  //       if (key == "controller"){
  //         movement["controller"]["type"] = controllerType
  //         let controllers = !isCamera? ["keyboard", "bounce"]:["orbit", "map", "pointerLock", "lookAt", "follow", "WASDRF"];
  //         controllers.forEach((type)=>{
  //           // object = ;
  //           setValues(objectMovement.controller[type],key);
  //         })
  //       }else{
  //         setValues(objectMovement[key],key);
  //       }
  //   }

  //   return movement
  // }

  function getMovementData(object) {
    var movement = {};
    let object3d= object;
    const {isCamera} = object;
    var controllerType = objectControllerType.getValue()

    if (object.userData.movement && object.userData.movement.customLimit) {
      movement.customLimit = object.userData.movement.customLimit
    }

    for (var key in objectMovement) {
      movement[key] = {}

      var object =
        key == "controller" ? objectMovement.controller[controllerType] : objectMovement[key]

        let controller = "";
        function setValues(){
          for (var id in object) {
            if (id !== "rows") {

              var field =
                (key == "direction" || key == "rotation" || key == "grow") && id.length == 1
                  ? object[id].value
                  : object[id]

              // if (controller === "orbit"){
              if (false){
                movement[key]["orbit"][id] = field.getValue()
              }else{
                movement[key][id] = field.getValue()

              }
    
            }
          }
        }

        
      

        if (key == "controller") movement["controller"]["type"] = controllerType
        
        if (key == "controller"){
          let controllers = !isCamera? ["keyboard", "bounce"]:["orbit", "map", "pointerLock", "lookAt", "follow", "WASDRF"];
          controllers.forEach((type)=>{
          // ["keyboard", "bounce"].forEach((type)=>{
            controller = type;
            object = objectMovement.controller[type];
            setValues();
          })
        }else{
          setValues();
        }
    }

    return movement
  }

  function getSelectableData() {
    var selectable = { drag: {} }

    selectable.selected = objectSelected.getValue()
    selectable.canSelect = objectCanSelect.getValue()
    selectable.canDeselect = objectCanDeselect.getValue()

    selectable.drag.type = objectDragType.getValue()

    if (selectable.drag.type != "none") {
      ;["x", "y", "z"].map((axis) => {
        selectable.drag[axis] = objectSelectableAxis[axis].getValue()
      })

      selectableKeys.map((key) => {
        selectable.drag[key] = objectSelectableTransform[key].getValue()
      })

      if (selectable.drag.type == "transform") {
        selectable.drag.show = objectSelectableHandleShow.getValue()
      }
    }

    return selectable
  }

  function movementSelectChanged() {
    var id = this.getId()
    var object = editor.selected

    if (id == "lookAt" && object.isSpotLight) {
      var uuid = this.getValue()
      var userData = object.userData
      var target = userData.target

      editor.execute(
        new SetValueCommand(editor, object, "userData", {
          ...userData,
          target: { ...target, uuid },
        })
      )
      objectMovement.lookAt.uuid.setValue(uuid)

      if (uuid == "none") {
        object.target = new THREE.Object3D()
        editor.lightHelpers.add(object.target)
        object.target.position.fromArray(target.position)
        editor.spotLights[object.target.id] = object
      } else {
        if (editor.spotLights[object.target.id]) {
          delete editor.spotLights[object.target.id]
          editor.lightHelpers.remove(object.target)
        }

        object.target = editor.objectByUuid(uuid)
      }

      object.target.updateMatrixWorld(true)
    } else {
      updateMovementRows(editor.selected)

      var lookAtUuid = objectMovement.lookAt.uuid.getValue()
      var goToUuid = objectMovement.goTo.uuid.getValue()
      updateMovementUI(editor.selected)
      objectMovement.lookAt.uuid.setValue(lookAtUuid)
      objectMovement.goTo.uuid.setValue(goToUuid)

      updateUserData()
    }
  }

  function selectableSelectChanged() {
    updateDragRows()

    var handleShow = objectSelectableHandleShow.getValue()
    updateSelectableUI(editor.selected)
    objectSelectableHandleShow.setValue(handleShow)

    updateUserData()
  }

  function updateDragRows() {
    var dragType = objectDragType.getValue()

    objectSelectableAxisRow.setDisplay(dragType == "none" ? "none" : "")
    objectSelectableHandleShowRow.setDisplay(dragType != "transform" ? "none" : "")
    objectSelectableTransformRow.setDisplay(dragType != "transform" ? "none" : "")
  }

  /** This probably only hides or shows Movement elements depending on the state */
  function updateMovementRows(object) {
    for (var key in objectMovementRows) {
      if (key != "controller") objectMovementRows[key].setDisplay("")
    }

    if (object.isCamera || object.type == "Particle") {
      ;["grow", "scaleLimit", "lookAt"].map((t) => {
        objectMovementRows[t].setDisplay("none")
      })
    } else if (object.isLight) {
      ;["grow", "scaleLimit", "rotationLimit"].map((t) => {
        objectMovementRows[t].setDisplay("none")
      })

      objectMovementRows["rotation"].setDisplay(object.isRectAreaLight ? "" : "none")
    }

    for (var key in objectMovementRows.controller) {
      var controllerType = objectControllerType.getValue()
      objectMovementRows.controller[key].setDisplay(key == controllerType ? "" : "none")
    }

    ;["lookAt", "goTo"].map((key) => {
      var uuid = objectMovement[key].uuid.getValue()

      if (object && object.userData && object.userData.movement && object.userData.movement[key]) {
        //uuid = object.userData.movement[key]['uuid'];
      }
      objectMovement[key].label.setDisplay(
        uuid == "cursor" ||
          uuid == "none" ||
          uuid == undefined ||
          (key == "lookAt" && object.isSpotLight)
          ? "none"
          : ""
      )
      objectMovement[key].speed.setDisplay(
        uuid == "cursor" ||
          uuid == "none" ||
          uuid == undefined ||
          (key == "lookAt" && object.isSpotLight)
          ? "none"
          : ""
      )
      objectMovementRows[key + "Axis"].setDisplay(
        uuid == "location" && !(key == "lookAt" && object.isSpotLight) ? "" : "none"
      )
      objectMovementRows[key + "AxisEnabled"].setDisplay(
        uuid != "cursor" &&
          uuid != "location" &&
          uuid != "none" &&
          uuid != undefined &&
          !(key == "lookAt" && object.isSpotLight)
          ? ""
          : "none"
      )
      //objectMovementRows[ key + 'FirstRow' ].setDisplay( uuid != 'cursor' && uuid != 'location' && uuid != 'none' && uuid != undefined && !(key == 'lookAt' && object.isSpotLight) ? '' : 'none' );
    })
  }

  function updateRows(object) {
    var properties = {
      width: objectWidthRow,
      height: objectHeightRow,
      fov: objectFovRow,
      left: objectLeftRow,
      right: objectRightRow,
      top: objectTopRow,
      bottom: objectBottomRow,
      near: objectNearRow,
      far: objectFarRow,
      intensity: objectIntensityRow,
      color: objectColorRow,
      groundColor: objectGroundColorRow,
      distance: objectDistanceRow,
      angle: objectAngleRow,
      penumbra: objectPenumbraRow,
      decay: objectDecayRow,
      castShadow: objectCastShadowRow,
      receiveShadow: objectReceiveShadowRow,
      shadow: [objectShadowBiasRow, objectShadowNormalBiasRow, objectShadowRadiusRow],
    }

    for (var property in properties) {
      var uiElement = properties[property]

      if (Array.isArray(uiElement) === true) {
        for (var i = 0; i < uiElement.length; i++) {
          uiElement[i].setDisplay(object[property] !== undefined ? "" : "none")
        }
      } else {
        uiElement.setDisplay(object[property] !== undefined ? "" : "none")
      }
    }

    // Movement

    if (object.userData && object.userData.isVoxel) {
      objectMovementAccordion.setDisplay("none")
      objectSpacialAccordion.setDisplay("none")
      objectRenderAccordion.setDisplay("none")
    } else {
      objectMovementAccordion.setDisplay(object.isScene ? "none" : "")
      objectSpacialAccordion.setDisplay("")
      objectRenderAccordion.setDisplay("")
    }
    if (object.userData && object.userData.isVoxel) {
      objectLimitAccordion.setDisplay("none")
    } else {
      objectLimitAccordion.setDisplay(object.isScene || object.type == "Particle" ? "none" : "")
    }

    var controllerType = object.userData.movement
      ? object.userData.movement.controller.type
      : "none"
    if (object.isCamera) {
      objectControllerType
        .setOptions({
          none: "None",
          orbit: "Orbit",
          map: "Map",
          pointerLock: "Pointer lock",
          lookAt: "Look at",
          follow: "Follow",
          WASDRF: "WASDRF",
        })
        .setValue(controllerType)
        //getting lookAtUuid
        let lookAtUuid = object.userData.movement?.controller?.uuid;
        lookAtObjectUuid.setValue(lookAtUuid !== undefined ? lookAtUuid : 'none');

        //getting follow uuid
        let followUuid = object.userData.movement?.controller?.followUuid;
        objectMovement.controller.follow.objectUuid.setValue(followUuid !== undefined ? followUuid : 'none');

        updateLookAtRows(false);;
    } else {
      objectControllerType
        .setOptions({
          none: "None",
          keyboard: "Keyboard",
          bounce: "Bounce",
        })
        .setValue(controllerType)
    }

    updateMovementRows(object)

    // Selectable

    if (object.userData && object.userData.isVoxel) {
      objectSelectableAccordion.setDisplay("none")
    } else {
      objectSelectableAccordion.setDisplay(object.isMesh || object.isSprite ? "" : "none")
    }

    var dragType = object.userData.selectable ? object.userData.selectable.drag.type : "none"
    objectDragType.setValue(dragType)

    updateDragRows()

    // Lens

    if (object.userData && object.userData.isVoxel) {
      objectLensAccordion.setDisplay("none")
    } else {
      objectLensAccordion.setDisplay(object.isCamera ? "" : "none")
    }

    // Styling

    if (object.userData && object.userData.isVoxel) {
      objectStylingAccordion.setDisplay("none")
    } else {
      objectStylingAccordion.setDisplay(object.isLight || object.type == "Particle" ? "" : "none")
    }

    if (object.userData && object.userData.isVoxel) {
      particleStylingDiv.setDisplay("none")
    } else {
      particleStylingDiv.setDisplay(object.type == "Particle" ? "" : "none")
    }
    if (object.type == 'Mesh') {
      objectAxesHelperRow.setDisplay("");
      objectAxesHelper.setValue(object.axesHelper !== undefined ? object.axesHelper : false)
      objectAxesHelperValue.setValue(object.axesHelperSize !== undefined ? object.axesHelperSize : 1)
    }
    else
      objectAxesHelperRow.setDisplay("none");
    //

    if (object.userData && object.userData.isVoxel) {
      objectReceiveShadowRow.setDisplay("none")
      objectFocusRow.setDisplay("none")
    } else {
      objectReceiveShadowRow.setDisplay("")
      objectFocusRow.setDisplay("")
      if (object.isLight) {
        objectReceiveShadowRow.setDisplay("none")
        objectFocusRow.setDisplay(object.isSpotLight ? "" : "none")
      }
    }

    if (object.userData && object.userData.isVoxel) {
      shadowCameraDiv.setDisplay("none")
      objectCastShadowRow.setDisplay("none")
      objectAdvancedHelperRow.setDisplay("none")
    } else {
      shadowCameraDiv.setDisplay(object.isDirectionalLight ? "" : "none")

      objectAdvancedHelperRow.setDisplay(object.isDirectionalLight ? "" : "none")

      if (object.isAmbientLight || object.isHemisphereLight) {
        objectCastShadowRow.setDisplay("none")
        objectAdvancedHelperRow.setDisplay("none")
      }
    }
  }

  function updateSpacialRows(object) {
    if (object.isLight || (object.isObject3D && object.userData.targetInverse)) {
      objectSpacialRows.rotation.setDisplay(object.isRectAreaLight ? "" : "none")
      objectSpacialRows.scale.setDisplay("none")
    } else {
      objectSpacialRows.rotation.setDisplay("")
      objectSpacialRows.scale.setDisplay("")
    }
  }

  /** This probably updates the values of the Ui elements after  updateMovementRows() selects which elements to show */
  function updateMovementUI(object) {
    var movement = object.userData.movement
    var controllerType = objectControllerType.getValue();
    
    for (var key in objectMovement) {

      // for solving some bug where keyboard contorls are undefined on refresh
      // if (key==="controller"){
        // controllerType=controllerType || object.userData.movement[key].type;
        // controllerType= object.userData.movement[key].type;
      // }

      var dataObj = key == "controller" ? objectMovement[key][controllerType] : objectMovement[key]


      for (var id in dataObj) {
        if (id != "label") {
          var field =
            (key == "direction" || key == "rotation" || key == "grow") && id.length == 1
              ? dataObj[id].value
              : dataObj[id]
          var value = ""
          var l = id.toLowerCase()

          if (movement && movement[key] && movement[key].hasOwnProperty(id)) {
            value = movement[key][id]
          } else if (
            l == "x" ||
            l == "y" ||
            l == "z" ||
            l == "yposition" ||
            (l == "speed" && key == "lookAt") ||
            id.includes("min")
          ) {
            value = 0;
          } else if (l.includes("speed")) {
            value = 1
          } else if (id.includes("maxHorizontal") || id.includes("maxRotational")) {
            //'horizontal', 'rotational'
            value = 360
          } else if (id.includes("max")) {
            value = 100
          } else if (l.includes("enabled")) {
            if ("lookAt" === key) {
              value = true
            } else {
              value = false
            }
          } else if (l == "uuid") {
            value = "none"
          } else if (l == "distance") {
            value = 5
          } else if (id == "local") {
            value = false
          } else if (id == "zoom" || id == "horizontal" || id == "rotational") {
            value = true
          } else {
            value = "?"
          }
          if (typeof value === "number" && isNaN(value)) value = 0;
          field.setValue(value)
        }
      }
    }

  }

  function updateSelectableUI(object) {
    var selectable = object.userData.selectable

    objectSelected.setValue(selectable ? selectable.selected : false)
    objectCanSelect.setValue(selectable ? selectable.canSelect : true)
    objectCanDeselect.setValue(selectable ? selectable.canDeselect : true)
      ;["x", "y", "z"].map((axis) => {
        objectSelectableAxis[axis].setValue(
          selectable && selectable.drag.type != "none" ? selectable.drag[axis] : true
        )
      })

    objectSelectableHandleShow.setValue(
      selectable && selectable.drag.type == "transform" ? selectable.drag.show : "when selected"
    )

    selectableKeys.map((key) => {
      objectSelectableTransform[key].setValue(
        selectable && selectable.drag.type == "transform" ? selectable.drag[key] : "?"
      )
    })
  }

  function updateCustsomLimitUI(object) {
    customLimits.clear()

    if (object.userData.movement && object.userData.movement.customLimit) {
      for (var limit of object.userData.movement.customLimit) {
        ; (function (limit) {
          var row = new UIRow()
          row.add(new UIText(limit.name))

          var enabled = new UIStyledCheckbox(limit.enabled).setIdFor(
            "custom-limit-" + (limit.type == "object" ? limit.uuid : limit.name)
          )
          enabled.onChange(function () {
            var index = object.userData.movement.customLimit.indexOf(limit)
            object.userData.movement.customLimit[index].enabled = this.getValue()
            updateUserData()
          })
          row.add(enabled)

          var remove = new UIImage(config.getImage("engine-ui/close-delete-btn.svg"))
          remove.setWidth("10px")
          remove.onClick(function () {
            if (confirm("Are you sure?")) {
              var index = object.userData.movement.customLimit.indexOf(limit)

              if (index != -1) {
                object.userData.movement.customLimit.splice(index, 1)
                row.delete()
                updateUserData()
              }
            }
          })
          row.add(remove)

          customLimits.add(row)
        })(limit)
      }
    }

    limitDropdownRow.setDisplay("none")
  }

  function updateUI(object) {
    if (!object.isScene) {
      updateRows(object);
      updateMovementRows(object);
      updateMovementUI(object)
      updateCustsomLimitUI(object)
    }

    if (object.isMesh || object.isSprite) {
      updateSelectableUI(object)
    }

    ;["position", "rotation", "scale"].map((spacial) => {
      ;["x", "y", "z"].map((axis) => {
        objectSpacials[spacial][axis].value.setValue(
          spacial == "rotation"
            ? object[spacial][axis] * THREE.MathUtils.RAD2DEG
            : object[spacial][axis]
        )
      })
    })

    updateConnectionUI(object)

    if (object.width !== undefined) {
      objectWidth.setValue(object.width)
    }

    if (object.height !== undefined) {
      objectHeight.setValue(object.height)
    }

    if (object.fov !== undefined) {
      objectFov.setValue(object.fov)
    }

    if (object.left !== undefined) {
      objectLeft.setValue(object.left)
    }

    if (object.right !== undefined) {
      objectRight.setValue(object.right)
    }

    if (object.top !== undefined) {
      objectTop.setValue(object.top)
    }

    if (object.bottom !== undefined) {
      objectBottom.setValue(object.bottom)
    }

    if (object.near !== undefined) {
      objectNear.setValue(object.near)
    }

    if (object.far !== undefined) {
      objectFar.setValue(object.far)
    }

    if (object.intensity !== undefined) {
      objectIntensity.setValue(object.intensity)
    }

    if (object.color !== undefined) {
      objectColor.setHexValue(object.color.getHexString())
    }

    if (object.groundColor !== undefined) {
      objectGroundColor.setHexValue(object.groundColor.getHexString())
    }

    if (object.distance !== undefined) {
      objectDistance.setValue(object.distance)
    }

    if (object.angle !== undefined) {
      objectAngle.setValue(object.angle)
    }

    if (object.penumbra !== undefined) {
      objectPenumbra.setValue(object.penumbra)
    }

    if (object.decay !== undefined) {
      objectDecay.setValue(object.decay)
    }

    if (object.isSpotLight) {
      objectFocus.setValue(object.shadow.focus)
    }

    if (object.castShadow !== undefined) {
      objectCastShadow.setValue(object.castShadow)
    }
    if (object.axesHelper !== undefined) {
      if (!objectAxesHelperRowInitiated) {
        for (let i = 0; i < object.children.length; i++) {
          if (object.children[i].name == "AxesHelperEngineTool") {
            object.remove(object.children[i]);
            i--;
          }
        }
        objectAxesHelperRowInitiated = true;
      }

      objectAxesHelper.setValue(object.axesHelper)
    }

    if (object.axesHelperSize !== undefined) {
      objectAxesHelperValue.setValue(object.axesHelperSize)
    }

    if (object.userData.advancedHelper) {
      objectAdvancedHelper.setValue(true)
    } else {
      objectAdvancedHelper.setValue(false)
    }

    if (object.receiveShadow !== undefined) {
      objectReceiveShadow.setValue(object.receiveShadow)
    }

    if (object.shadow !== undefined) {
      objectShadowBias.setValue(object.shadow.bias)
      objectShadowNormalBias.setValue(object.shadow.normalBias)
      objectShadowRadius.setValue(object.shadow.radius)

      if (object.isDirectionalLight) {
        shadowCameraWidth.setValue(object.shadow.camera.right * 2)
        shadowCameraHeight.setValue(object.shadow.camera.top * 2)
        shadowCameraFar.setValue(object.shadow.camera.far)
        shadowCameraNear.setValue(object.shadow.camera.near)
        shadowCameraZoom.setValue(object.shadow.camera.zoom)
      }
    }

    objectVisible.setValue(object.visible)

    // objectAxesHelper.setValue(object.axesHelper !== undefined)
    // objectAxesHelperValue.setValue(
    //   object.axesHelper !== undefined ? object.axesHelper.scale.x || 1 : 1
    // )

    updateSpacialRows(object)

    if (object.type == "Particle") {
      particleTexture.setValue(object.group.texture)
      particleCount.setValue(object.group.maxParticleCount)
      particleBlendMode.setValue(object.group.blending)
      particleDirection.setValue(object.emitter.direction)
      particleRate.setValue(object.emitter.particleCount)
      particleDuration.setValue(object.emitter.duration ? object.emitter.duration : 0)
      particleEmitterType.setValue(object.emitter.type)
      particleAgeF.setValue(object.emitter.maxAge.value)
      particleAgePlusMinus.setValue(object.emitter.maxAge.spread)
        ;["position", "velocity", "acceleration"].map((t) => {
          ;["x", "y", "z"].map((x) => {
            particleSpeed[t]["initial"][x].setValue(object.emitter[t].value[x])
            particleSpeed[t]["variation"][x].setValue(object.emitter[t].spread[x])
          })
        })

      particleWiggleF.setValue(object.emitter.wiggle.value)
      particleWigglePlusMinus.setValue(object.emitter.wiggle.spread)

      particleOpacity.setValue(object.emitter.opacity.value)
      particleOpacity.setValue(object.emitter.opacity.spread, "spread")
      particleOpacity.updateSize()
      particleScale.setValue(object.emitter.size.value)
      particleScale.setValue(object.emitter.size.spread, "spread")
      particleScaleMin.setValue(particleScale.min)
      particleScaleMax.setValue(particleScale.max)
      particleScale.updateSize()
      particleRotation.setValue(object.emitter.angle.value)
      particleRotation.setValue(object.emitter.angle.spread, "spread")
      particleRotationMin.setValue(particleRotation.min)
      particleRotationMax.setValue(particleRotation.max)
      particleRotation.updateSize()

      particleBaseColor.setValue(object.emitter.color.value)
      particleBaseColor.updateSize()

      var colorSpread = []
      for (var i = 0; i < 4; i++) {
        var color = object.emitter.color.spread[i]
        colorSpread.push(new THREE.Color(color.x, color.y, color.z))
      }

      particleSpreadColor.setValue(colorSpread)
      particleSpreadColor.updateSize()
    }
  }

  function updateLimitDropdown() {
    var options = Object.assign({}, editor.objectsWithoutVoxels)

    Object.keys(editor.tags).map((name) => {
      options["tag/" + name] = name
    })

    limitDropdown.setOptions(options)
  }

  function updateObjectMovementDropdowns(object) {
    if (object.isCamera || object.isMesh || object.isGroup || object.isSprite) {
      objectMovement.goTo.uuid.setOptions(
        Object.assign({ none: "None", location: "Location" }, editor.objectsWithoutVoxels)
      )
      objectMovement.lookAt.uuid.setOptions(
        Object.assign(
          { none: "None", location: "Location", cursor: "Cursor Location" },
          editor.objectsWithoutVoxels
        )
      )
      objectMovement.controller.lookAt.uuid.setOptions(
        Object.assign({ none: "None", location: "Location" }, editor.objectsWithoutVoxels)
      )
      objectMovement.controller.follow.objectUuid.setOptions(
        Object.assign({ none: "None" }, editor.objectsWithoutVoxels)
      )
    }
  }

  function updateConnectionUI(object) {
    var objectConnection = object.userData.connection

      ;["position", "rotation", "scale"].map((spacial) => {
        ;["x", "y", "z"].map((axis) => {
          var connection =
            objectConnection && objectConnection[spacial] ? objectConnection[spacial][axis] : null
          var labelText = axis.toUpperCase()

          objectSpacials[spacial][axis].label.setValue(connection ? labelText + "*" : labelText)
        })
      })
      ;["direction", "rotation", "grow"].map((mv) => {
        var key = mv == "rotation" ? "rotate" : mv

          ;["x", "y", "z"].map((axis) => {
            var connection =
              objectConnection && objectConnection[key] ? objectConnection[key][axis] : null
            var labelText = axis.toUpperCase()

            objectMovement[mv][axis].label.setValue(connection ? labelText + "*" : labelText)
          })
      })
      ;["Intensity", "Fov", "Near", "Far"].map((key) => {
        objectLabels[key].setValue(
          objectConnection && objectConnection[key.toLowerCase()] ? key + "*" : key
        )
      })
  }

  function updateSpacialConnectionRows(spacial, axis, e) {
    //console.log(spacial, axis, e);
    ;["position", "rotation", "scale"].map((spacial1) => {
      ;["x", "y", "z"].map((axis1) => {
        if (spacial1 == spacial && axis == axis1) {
          if (!objectSpacials[spacial][axis]["label"].hasClass("markSelected")) {
            objectSpacials[spacial][axis]["label"].addClass("markSelected")
            objectSpacialConnections[spacial1].setDisplay("")
          } else {
            objectSpacials[spacial1][axis1]["label"].removeClass("markSelected")
            objectSpacialConnections[spacial1].setDisplay("none")
          }
        } else {
          objectSpacials[spacial1][axis1]["label"].removeClass("markSelected")
        }
      })
      if (spacial != spacial1) {
        objectSpacialConnections[spacial1].setDisplay("none")
      }
    })

    var connection = editor.selected.userData.connection
    objectSpacialConnections[spacial].setAxis(axis)
    objectSpacialConnections[spacial].clearValues()

    if (connection && connection[spacial] && connection[spacial][axis])
      objectSpacialConnections[spacial].setValues(connection[spacial][axis])
  }

  function updateMovementConnectionRows(mv, axis) {
    //console.log(mv, axis);
    ;["direction", "rotation", "grow"].map((mv1) => {
      ;["x", "y", "z"].map((axis1) => {
        if (mv == mv1 && axis == axis1) {
          if (!objectMovement[mv1][axis1]["label"].hasClass("markSelected")) {
            objectMovement[mv1][axis1]["label"].addClass("markSelected")
            objectMovementConnections[mv1].setDisplay("")
          } else {
            objectMovement[mv1][axis1]["label"].removeClass("markSelected")
            objectMovementConnections[mv1].setDisplay("none")
          }
        } else {
          objectMovement[mv1][axis1]["label"].removeClass("markSelected")
        }
      })
      if (mv != mv1) {
        objectMovementConnections[mv1].setDisplay("none")
      }
    })

    var connection = editor.selected.userData.connection
    var key = mv == "rotation" ? "rotate" : mv
    objectMovementConnections[mv].setAxis(axis)
    objectMovementConnections[mv].clearValues()

    if (connection && connection[key] && connection[key][axis])
      objectMovementConnections[mv].setValues(connection[key][axis])
  }

  function updateConnectionRows(key) {
    ;["intensity", "fov", "near", "far"].map((s) => {
      var connection = editor.selected.userData.connection
      const isHidden = objectConnections[s].getStyle("display") === "none"
      objectConnections[s].setDisplay(s == key && isHidden ? "" : "none")
      objectConnections[s].clearValues()

      if (s == key && connection && connection[key]) objectConnections[s].setValues(connection[key])
    })
  }

  function updateConnectionValues(key, e) {
    if (e.eventType == "connection") {
      var object = editor.selected

      if (!object.userData.connection) {
        object.userData.connection = {}
      }

      if (e.enabled) {
        object.userData.connection[key] = {}
        object.userData.connection[key]["mouse"] = e.mouse
        object.userData.connection[key]["speed"] = e.speed
        object.userData.connection[key]["value"] = object[key]
      } else {
        delete object.userData.connection[key]
      }

      updateConnectionUI(object)

      editor.execute(new SetValueCommand(editor, object, "userData", object.userData))
    }
  }

  // events

  signals.cameraChanged.add(function (camera) {
    if (editor.selected == camera) {
      ;["position", "rotation"].map((spacial) => {
        ;["x", "y", "z"].map((axis) => {
          objectSpacials[spacial][axis].value.setValue(
            spacial == "rotation"
              ? camera[spacial][axis] * THREE.MathUtils.RAD2DEG
              : camera[spacial][axis]
          )
        })
      })
    }
  })

  signals.objectSelected.add(function (object) {
    if (object !== null) {
      container.setDisplay("block")

      updateUI(object)
      updateRows(object)

      if (object.isSpotLight) {
        objectMovement.lookAt.uuid.setOptions(
          Object.assign({ none: "None" }, editor.objectsWithoutVoxels)
        )
        objectMovement.lookAt.uuid.setValue(object.userData.target.uuid)
      } else {
        objectMovement.lookAt.uuid.setOptions(
          Object.assign(
            { none: "None", location: "Location", cursor: "Cursor Location" },
            editor.objectsWithoutVoxels
          )
        )
      }
    } else {
      container.setDisplay("none")
    }
  })

  signals.objectChanged.add(function (object) {
    if (object !== editor.selected) return

    updateObjectMovementDropdowns(object)
    updateLimitDropdown()

    updateUI(object)
  })

  signals.objectAdded.add(function (object) {
    updateObjectMovementDropdowns(object)
    updateLimitDropdown()
  })

  signals.objectRemoved.add(function (object) {
    updateObjectMovementDropdowns(object)
    updateLimitDropdown()
  })

  signals.tagChanged.add(function () {
    updateLimitDropdown()
  })

  signals.tagAdded.add(function () {
    updateLimitDropdown()
  })

  signals.tagRemoved.add(function () {
    updateLimitDropdown()
  })

  signals.refreshSidebarObject3D.add(function (object) {
    if (object !== editor.selected) return

    updateUI(object)
  })

  return container
}

export { SidebarObject }
