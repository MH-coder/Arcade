import { h, Component, PureComponent, render, Fragment, createContext } from "preact"
import { useRef, useContext } from "preact/hooks"
import { createPortal, memo } from "preact/compat"
import classNames from "classnames"
import { useState, useCallback, useEffect } from "preact/hooks"
import Masonry from "react-masonry-css"
import { ContextMenu, ContextMenuTrigger } from "preact-context-menu"
import { css, cx } from "@emotion/css"
import * as dayjs from "dayjs"
import * as utc from "dayjs/plugin/utc"
dayjs.extend(utc)
import Lottie from "react-lottie-player"
import AnimateHeight from "react-animate-height"
import Masonry2, { ResponsiveMasonry } from "react-responsive-masonry"
import useInfiniteScroll from "react-infinite-scroll-hook"
import { useDebouncedCallback } from "use-debounce"
import ReactHowler from "react-howler"
import { isBrowser, isMobile } from "react-device-detect"

// stop playing audio when you leave the tab

const projectsInitItem = "projects"

const Context = createContext({})

class Tabs extends Component {
  constructor(props) {
    super(props)
    this.activeItem = projectsInitItem
    this.data = {}
  }
  state = {
    activeItem: projectsInitItem,
    openItem: null,
    draggingItemId: null,
    portalMenu: false,
    adding: [],
    accordionOpenIds: [],
    accordionInitialOpenIds: [], // prevents loading data before accordion open
    creatingFolder: false,
  }
  componentDidMount() {
    this.updateMenuState()
    $(document).on("top-menu-change", () => {
      this.updateMenuState(true)
    })
  }
  // menu
  updateMenuState(init) {
    const assetsMenuSelected = $(".tab-item[data-target=tab-assets]").hasClass("active")
    this.setState({
      portalMenu: assetsMenuSelected,
    })

    if (assetsMenuSelected && (init || this.activeItem === projectsInitItem)) {
      this.setState({ activeItem: projectsInitItem })
      $("#tab-project").addClass("open")
      $("#tab-assets").css("height", "0")

      // this.onMenuClick(menuItems[4]) // for testing
    } else {
      $("#tab-project").removeClass("open")
      $("#tab-assets").css("height", "100%")
    }
  }
  onMenuClick = (item) => {
    this.activeItem = item.name
    this.setState({ activeItem: item.name, openItem: null })
    this.closeAllAccordions()

    this.getData(item)
    this.updateMenuState()
  }

  // data
  getData(item) {
    this.setState({ loading: true })

    if (item.name === "video") {
      this.data[item.name] = [{ name: "pixabay", pixabay: true }]
      if (this.state[item.name]) {
        setTimeout(() => {
          this.setState({ loading: false })
        }, 500)
        return
      }

      this.getMyData()
      return
    }

    if (!item.url) return

    if (this.state[item.name]) {
      setTimeout(() => {
        this.setState({ loading: false })
      }, 500)
      return
    }

    $.get(item.url, (data) => {
      data = parseData(data)
      if (item.name === "images") {
        data = insert(data, 0, { name: "unsplash", unsplash: true })
      }
      this.data[item.name] = data
      this.getMyData()
    })
  }
  getMyName() {
    return menuItems.find((i) => i.name === this.activeItem).myName
  }
  getMyData(cb) {
    const name = this.activeItem
    if (name === projectsInitItem) return

    $.get("asset/my-" + this.getMyName(), (myData) => {
      this.setState({
        [name]: [
          { my: true, name: "My " + name, accordion: true, items: myData },
          ...this.data[name].filter((i) => !i.my),
        ],
      })
      setTimeout(() => {
        this.setState({ loading: false })
      }, 500)
      typeof cb === "function" && cb()
    })
  }
  addToMy(e, id) {
    const name = this.getMyName()

    if (this.isMyDataContains(id) || this.isAddingId(id)) return

    this.startSpinnerId(id)

    $.post(`/asset/my-${name}/add`, { id, folderId: 0 }, () => {
      this.getMyData(() => {
        this.stopSpinnerId(id)
      })
    })
  }
  uploadToMy(e, type, url, id) {
    if (this.isMyDataContains(id) || this.isAddingId(id)) return
    this.startSpinnerId(id)

    let fileName = new URL(url).pathname.split("/").pop()
    if (type === "Image") {
      const ext = url.match(/fm=([^&]*)&/)[1]
      fileName += "." + ext
    }
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], fileName, { type: blob.type })
        const formData = new FormData()
        formData.append("type", type)
        formData.append("file", file)

        fetch(`/asset/my-${type}/upload`, {
          method: "POST",
          body: formData,
        }).then((res) => {
          this.getMyData(() => {
            this.stopSpinnerId(id)
          })
        })
      })
      .catch((err) => {
        this.stopSpinnerId(id)
        console.error(err)
      })
  }
  deleteFromMy(e, id) {
    const name = this.getMyName()
    this.startSpinnerId(id)
    $.post(`/asset/my-${name}/delete`, { id }, () => {
      this.getMyData(() => {
        this.stopSpinnerId(id)
      })
    })
  }
  isAddingId(id) {
    return this.state.adding.find((a) => a.name === this.getMyName() && a.id === id)
  }
  startSpinnerId(id) {
    this.setState({ adding: [...this.state.adding, { name: this.getMyName(), id }] })
  }
  stopSpinnerId(id) {
    this.setState({
      adding: this.state.adding.filter((a) => !(a.name === this.getMyName() && a.id === id)),
    })
  }
  // actions
  toggleAccordion(id) {
    if (this.isAccordionIdOpen(id)) {
      this.closeAccordion(id)
    } else {
      this.openAccordion(id)
    }
  }
  openAccordion(id) {
    this.setState({
      accordionOpenIds: [...this.state.accordionOpenIds, id],
      accordionInitialOpenIds: [...this.state.accordionInitialOpenIds, id],
    })
  }
  closeAllAccordions() {
    this.setState({ accordionOpenIds: [] })
  }
  closeAccordion(id) {
    this.setState({
      accordionOpenIds: this.state.accordionOpenIds.filter((openId) => openId !== id),
    })
  }
  isMyDataContains(id) {
    const data = this.state[this.state.activeItem]
    if (!data) return false

    return data[0].items.find((folder) =>
      folder.items.find((d) => d[this.getMyName() + "Id"] === id)
    )
  }
  isMyDataOpened() {
    return this.state.openItem && this.state.openItem.startsWith("My")
  }
  getContext() {
    const { adding, activeItem, openItem, accordionOpenIds } = this.state
    const myName = this.getMyName()
    return {
      myName,
      myDataContains: (id) => this.isMyDataContains(id),
      addingToMy: (id) => this.addingToMy(id),
      onAddToMyClick: (e, id) => {
        if (this.isMyDataOpened()) return

        this.addToMy(e, id)
      },
      uploadToMy: (e, type, url, id) => this.uploadToMy(e, type, url, id),
      onDeleteClick: (id) => {
        $.post("/folder/delete/" + id, () => {
          this.getMyData()
        })
      },
      isAccordionIdOpen: (id) => this.isAccordionIdOpen(id),
      isAccordionIdInitialOpen: (id) => this.isAccordionIdInitialOpen(id),
      activeItem: activeItem,
      isMyItemOpened: this.isMyDataOpened(),
      toggleAccordion: (id) => this.toggleAccordion(id),
      onDragStart: (draggingItemId) => {
        setTimeout(() => {
          this.closeAllAccordions()
          this.setState({ draggingItemId })
        }, 1)
      },
      deleteFromMy: (e, id) => this.deleteFromMy(e, id),
    }
  }
  addingToMy = (id) => this.isAddingId(id)
  isAccordionIdOpen = (id) => this.state.accordionOpenIds.indexOf(id) > -1
  isAccordionIdInitialOpen = (id) => this.state.accordionInitialOpenIds.indexOf(id) > -1

  renderData() {
    const { openItem, activeItem, loading, creatingFolder } = this.state

    // projects
    if (activeItem === projectsInitItem) {
      return
    }

    if (loading) return <div>Loading...</div>

    // list of initial items
    if (!openItem) {
      return this.renderCategories()
    }

    const data = this.state[this.state.activeItem]
    const data1 = data.find(({ name }) => name === openItem)

    // item with different types of data
    return (
      <div>
        <TopButtons
          onGoBackClick={() => setTimeout(() => this.setState({ openItem: null }), 1)}
          showCreateFolderButton={data1.my}
          onCreateFolderClick={() => {
            this.setState({ creatingFolder: true })
            $.post("/folder/create", { type: this.getMyName(), name: "Untitled" }, () => {
              this.getMyData(() => {
                this.setState({ creatingFolder: false })
              })
            })
          }}
          creatingFolder={creatingFolder}
        />
        <Context.Provider value={this.getContext()}>{this.renderOpenCategory()}</Context.Provider>
      </div>
    )
  }
  renderCategories() {
    const data = this.state[this.state.activeItem]

    if (!data) return

    return (
      <Context.Provider value={this.getContext()}>
        <div
          class={classNames(
            "categories",
            css`
              display: grid;
              --n: ${isBrowser ? "4" : "1"};
              grid-template-columns: repeat(auto-fill, minmax(max(200px, 100% / var(--n)), 1fr));
              grid-gap: 20px;
              margin-top: 20px;
            `
          )}
        >
          {data.map(
            ({
              id,
              name,
              my,
              thumbUrl = "https://assets.website-files.com/616a041ea72c58e139ed3c8e/616a041ea72c58999ded3dc1_my-heartdrive.png",
            }) => {
              const thumbs = {
                "99sounds":
                  "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/audio/99sounds.png",
                unsplash:
                  "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/images/unsplash.png",
                Kane:
                  "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/images/kane-gallery.png",
                pixabay:
                  "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/video/pixabay.png",
                Lottie:
                  "https://arcadestudio-assets.s3.us-east-2.amazonaws.com/gallery/animations/lottie.png",
              }
              if (thumbs[name]) {
                thumbUrl = thumbs[name]
              }
              if (this.addingToMy(id)) {
                return <Spinner />
              }
              return (
                <CategoriesItem
                  id={id}
                  name={name}
                  thumbUrl={thumbUrl}
                  onOpenItemClick={(e) => {
                    if (this.activeItem === "environment" && name !== "My environment") {
                      this.addToMy(e, id)
                      return
                    }
                    this.setState({ openItem: name })
                  }}
                  isMyData={my}
                />
              )
            }
          )}
        </div>
      </Context.Provider>
    )
  }
  renderOpenCategory() {
    const data = this.state[this.state.activeItem]
    const data1 = data.find(({ name }) => name === this.state.openItem)

    if (data1.unsplash) return <Unsplash />

    if (data1.pixabay) return <Pixabay />

    // render items
    if (!data1.accordion) {
      return (
        <div
          class={css`
            padding-top: 20px;
          `}
        >
          <Items data={data1} />
        </div>
      )
    }

    // render accordion
    return (
      <div
        class={css`
          padding-top: 40px;
        `}
      >
        {/* LEVEL 1 ------------------------------------------------------------- */}
        {data1.items.map((data2) => {
          return (
            <div>
              <AccordionHead
                data={data2}
                onItemDrop={() => {
                  const folderId = data2.id
                  $.post(
                    `/asset/my-${this.getMyName()}/update/` + this.state.draggingItemId,
                    { folderId },
                    () => {
                      this.getMyData(() => {
                        setTimeout(() => {
                          this.openAccordion(folderId)
                        }, 100)
                      })
                    }
                  )
                  this.setState({ draggingItemId: null })
                }}
                onNameUpdate={() => {
                  // TODO: post if the name is changed
                  $.post("/folder/update/" + data2.id, { name: data2.name }, () => {
                    this.getMyData()
                  })
                }}
                onImport={(e) => {
                  const formData = new FormData()

                  formData.append("type", "Geometry")
                  formData.append("folderId", data2.id)
                  // formData.append("projectId", 1272)

                  const files = e.target.files
                  for (let i = 0; i < files.length; i++) {
                    formData.append(`file`, files[i])
                  }

                  fetch("/asset/my-geometry/upload", {
                    method: "POST",
                    body: formData,
                  }).then((response) => this.getMyData())
                }}
                disableContextMenu={data2.name === "Recent"}
                enableImport={data1.my && data1.name !== "My materials"}
              />
              <AnimateHeight
                duration={300}
                height={this.isAccordionIdOpen(data2.id) ? "auto" : 0}
                delay={200}
              >
                {this.isAccordionIdInitialOpen(data2.id) && <Items data={data2} />}
              </AnimateHeight>
            </div>
          )
        })}
      </div>
    )
  }

  render({}, { activeItem, portalMenu }) {
    return (
      <div>
        {this.renderData()}
        <MenuPortal>
          <Menu portalMenu={portalMenu} activeItem={activeItem} onClick={this.onMenuClick} />
        </MenuPortal>
      </div>
    )
  }
}

const TopButtons = ({
  onGoBackClick,
  showCreateFolderButton,
  onCreateFolderClick,
  creatingFolder,
}) => {
  return (
    <div
      class={classNames(
        "top-buttons",
        css`
          position: absolute;
          display: flex;
          justify-content: space-between;
          flex-direction: row;
          width: 100%;
          padding-top: 5px;
        `
      )}
    >
      <button
        onClick={onGoBackClick}
        class={css`
          &,
          &:hover,
          &:focus {
            background: none;
          }
        `}
      >
        <div
          class={css`
            display: -webkit-box;
            display: -webkit-flex;
            display: -ms-flexbox;
            display: flex;
            width: 14px;
            height: 14px;
            margin-left: 4px;
            -webkit-box-pack: center;
            -webkit-justify-content: center;
            -ms-flex-pack: center;
            justify-content: center;
            -webkit-box-align: center;
            -webkit-align-items: center;
            -ms-flex-align: center;
            align-items: center;
            border-style: none none solid solid;
            border-width: 1px;
            border-color: #6c8db8;
            border-radius: 0px 0px 0px 4px;
            -webkit-transform: rotate(45deg);
            -ms-transform: rotate(45deg);
            transform: rotate(45deg);
            cursor: pointer;
          `}
        />
      </button>
      {showCreateFolderButton && (
        <div
          onClick={onCreateFolderClick}
          class={css`
            display: flex;
            width: 24px;
            height: 24px;
            justify-content: center;
            align-items: center;
            border: 1px solid #48648f;
            border-radius: 3px;
            &,
            &:hover,
            &:focus {
              background: none;
            }
            cursor: pointer;
          `}
        >
          {creatingFolder ? (
            <Spinner size={1} />
          ) : (
            <img
              src="https://assets.website-files.com/616a041ea72c58e139ed3c8e/616a041ea72c583813ed3ca9_plus.png"
              alt=""
              class={css`
                max-width: 40%;
                vertical-align: middle;
                display: inline-block;
              `}
            />
          )}
        </div>
      )}
    </div>
  )
}

const AccordionHead = ({
  data,
  onItemDrop,
  onNameUpdate,
  onImport,
  disableContextMenu,
  enableImport,
}) => {
  const { onDeleteClick, isMyItemOpened, toggleAccordion } = useContext(Context)

  return (
    <div
      key={data.id}
      onDrop={isMyItemOpened && onItemDrop}
      onDragOver={
        isMyItemOpened
          ? (e) => {
              e.stopPropagation()
              e.preventDefault()
            }
          : false
      }
      onClick={() => toggleAccordion(data.id)}
      class={classNames(
        "accordionItem",
        css`
          display: flex;
          overflow: hidden;
          height: auto;
          justify-content: space-between;
          flex: 0 0 auto;
          padding-right: 0px;
          padding-left: 15px;
          border-bottom: 1px solid #060708;
          background-color: #151929;
          width: 100%;
          height: 100%;
          height: 60px;
          align-items: center;
          button {
            display: none;
          }
          &:hover,
          &:focus {
            background-color: rgba(23, 25, 34, 0.6);
            button {
              display: block;
            }
          }
          cursor: pointer;
          & > span {
            display: flex;
            width: 100%;
            height: 60px;
          }
        `
      )}
    >
      {/*TODO: only use for my things*/}
      <ContextMenuTrigger
        id={data.id}
        class={css`
          display: block;
        `}
        disabled={disableContextMenu}
      >
        <InlineEdit
          class={classNames("title")}
          value={data.name}
          setValue={onNameUpdate}
          forceReadOnly={disableContextMenu}
        />
      </ContextMenuTrigger>
      <ContextMenu id={data.id}>
        <div onclick={() => onDeleteClick(data.id)}>Delete</div>
      </ContextMenu>

      <input
        id={"input" + data.id}
        type="file"
        multiple
        onChange={onImport}
        style={{ display: "none" }}
      />
      {enableImport && (
        <button
          onClick={() => $("#input" + data.id).click()}
          class={css`
            font-family: Exo, sans-serif;
            background: #111218;
            height: 100%;
            &:hover,
            &:focus {
              background: #151929;
            }
            font-size: 16px;
            font-weight: 200;
            white-space: nowrap;
            color: #95bff6;
            padding: 0 20px;
            text-transform: none;
          `}
        >
          Import
        </button>
      )}
    </div>
  )
}

const Items = ({ data }) => {
  let {
    activeItem,
    isMyItemOpened,
    addingToMy,
    myName,
    onAddToMyClick,
    onDeleteClick,
    myDataContains,
    isAccordionIdOpen,
    isAccordionIdInitialOpen,
    onDragStart,
  } = useContext(Context)

  if (activeItem === "images") {
    return (
      <div class={classNames("accordion-body")}>
        <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3 }}>
          <Masonry2 gutter="10px">
            {data.items.map((data3) => {
              return (
                <div
                  class={css`
                    width: 100%;
                    cursor: pointer;
                    position: relative;
                    ${slideMenuParentCSS}
                  `}
                  ondragstart={() => onDragStart(data3.id)}
                  onClick={(e) => onAddToMyClick(e, data3.id)}
                >
                  {addingToMy(data3.id) && <Spinner isMasonry={true} />}
                  <SlideMenu id={data3.id} />
                  <Heart id={data3.id} />

                  <img
                    src={data3.thumbUrl || data3.url}
                    loading="lazy"
                    class={classNames(
                      "accordion-item-image",
                      css`
                        display: block;
                        width: 100%;
                        ${addingToMy(data3.id) && "visibility: hidden;"}
                      `
                    )}
                  />
                </div>
              )
            })}
          </Masonry2>
        </ResponsiveMasonry>
      </div>
    )
  }

  let gridN = 4
  if (activeItem === "animation") {
    gridN = 5
  }

  const grid = css`
    display: grid;
    --n: ${gridN};
    grid-template-columns: repeat(auto-fill, minmax(max(200px, 100% / var(--n)), 1fr));
    grid-gap: 20px;
    padding: 20px 0;
    grid-template-rows: masonry;
  `

  return (
    <div class={data.accordion ? "" : grid}>
      {data.items.map((data2) => {
        if (addingToMy(data2.id)) {
          return <Spinner size={activeItem === "audio" ? 2 : 10} />
        }

        if (data.accordion) {
          return (
            <div>
              <AccordionHead data={data2} />
              <AnimateHeight
                duration={300}
                height={isAccordionIdOpen(data2.id) ? "auto" : 0}
                delay={200}
              >
                {isAccordionIdInitialOpen(data2.id) && <Items data={data2} />}
              </AnimateHeight>
            </div>
          )
        }

        if (activeItem === "audio" && data2.url) {
          return <Audio id={data2.id} name={data2.name} src={data2.url} />
        }

        if (activeItem === "environment") {
          return (
            <CategoriesItem
              id={data2.id}
              name={data2.name}
              thumbUrl={data2.thumbUrl}
              isMyData={true}
            />
          )
        }

        if (activeItem === "animation" && data2.url) {
          return <LottieItem id={data2.id} name={data2.name} url={data2.url} />
        }

        if (activeItem === "video" && data2.url) {
          return <PixabayVideo name={data2.name} id={data2.id} url={data2.url} />
        }

        return (
          <div
            class="accordion-item"
            onDragStart={() => onDragStart(data2.id)}
            draggable={isMyItemOpened}
            onClick={(e) => {
              onAddToMyClick(e, data2.id)
            }}
          >
            <div
              class={css`
                display: flex;
                width: 100%;
                height: 250px;
                margin-bottom: 0px;
                -webkit-box-pack: center;
                justify-content: center;
                -webkit-box-align: center;
                align-items: center;
                border-radius: 0px;
                background-color: #20232e;
                background-image: none;
                background-position: 0px 0px;
                background-size: auto;
                background-repeat: repeat;
                background-attachment: scroll;
                cursor: pointer;

                border-radius: 15px;
                ${slideMenuParentCSS}
              `}
            >
              <SlideMenu id={data2.id} borderRadius={15} />
              <Heart id={data2.id} />

              <img
                src={data2.thumbUrl || data2.url}
                loading="lazy"
                class={classNames(
                  "accordion-item-image",
                  css`
                    width: 200px;
                    max-height: 200px;
                  `
                )}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const slideMenuParentCSS =
  "position: relative; overflow:hidden; &:hover > .slide-menu {transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); opacity: 1; transform-style: preserve-3d;}"

const SlideMenu = ({ borderRadius, id }) => {
  const { isMyItemOpened, deleteFromMy } = useContext(Context)
  if (!isMyItemOpened) return

  const borderRadiusCSS = borderRadius
    ? `border-radius: ${borderRadius}px 0px 0px ${borderRadius}px;`
    : ""
  return (
    <div
      class={classNames(
        "slide-menu",
        css`
          position: absolute;
          z-index: 1;
          left: 0%;
          top: 0%;
          right: auto;
          bottom: 0%;
          display: -webkit-box;
          display: -webkit-flex;
          display: -ms-flexbox;
          display: flex;
          width: auto;
          height: 100%;
          padding-top: 0%;
          padding-bottom: 0%;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -webkit-flex-direction: column;
          -ms-flex-direction: column;
          flex-direction: column;
          -webkit-justify-content: space-around;
          -ms-flex-pack: distribute;
          justify-content: space-around;
          -webkit-box-align: center;
          -webkit-align-items: center;
          -ms-flex-align: center;
          align-items: center;
          border-style: solid;
          border-width: 1px;
          border-color: rgba(29, 32, 43, 0.95);

          background-color: rgba(29, 32, 43, 0.95);
          transition: transform 0.2s, opacity 0.2s;
          transform: translate3d(-40px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg)
            rotateZ(0deg) skew(0deg, 0deg);
          opacity: 0;
          transform-style: preserve-3d;
          ${borderRadiusCSS}
        `
      )}
    >
      <div
        class={css`
          display: -webkit-box;
          display: -webkit-flex;
          display: -ms-flexbox;
          display: flex;
          width: auto;
          height: 100%;
          padding: 14px;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -webkit-flex-direction: column;
          -ms-flex-direction: column;
          flex-direction: column;
          -webkit-box-pack: justify;
          -webkit-justify-content: space-between;
          -ms-flex-pack: justify;
          justify-content: space-between;
          -webkit-box-align: center;
          -webkit-align-items: center;
          -ms-flex-align: center;
          align-items: center;
        `}
      >
        <div class="edit-portfolio-image-btn"></div>
        <div class="open-published-project-link"></div>
        <div class="monetization-btn"></div>
        <div class="social-share-btn"></div>
        <div
          onClick={(e) => deleteFromMy(e, id)}
          class={css`
            position: static;
            left: auto;
            top: auto;
            right: auto;
            bottom: 20px;
            width: 23px;
            height: 23px;
            background-image: url(https://assets.website-files.com/616a041ea72c58e139ed3c8e/616a041ea72c580ce8ed3dd8_remove-published-project-from-gallery.svg);
            background-position: 50% 50%;
            background-size: auto;
            background-repeat: no-repeat;
            background-attachment: scroll;
            cursor: pointer;
          `}
        ></div>
      </div>
    </div>
  )
}

const HeartParentCSS = "position: relative; "

const Heart = ({ id, audio }) => {
  const { isMyItemOpened, myDataContains } = useContext(Context)
  if (isMyItemOpened) return
  if (!myDataContains(id))
    return (
      <div
        class={css`
          padding-left: 19px;
        `}
      ></div>
    )

  const Image = () => (
    <div
      class={css`
        padding-left: ${audio ? "5px" : ""};
      `}
    >
      <img
        class={css`
          width: ${audio ? "14px" : "30px"};
        `}
        src="https://arcadestudio-assets.s3.us-east-2.amazonaws.com/engine-ui/heart-filled.svg"
      />
    </div>
  )
  if (audio) return <Image />

  return (
    <div
      class={classNames(
        "heart",
        css`
          position: absolute;
          z-index: 1;
          left: auto;
          top: 0%;
          right: 0%;
          bottom: 0%;
          display: flex;
          width: auto;
          height: 100%;
          padding-top: 0%;
          padding-bottom: 0%;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
        `
      )}
    >
      <div
        class={css`
          display: -webkit-box;
          display: -webkit-flex;
          display: -ms-flexbox;
          display: flex;
          width: auto;
          height: 100%;
          padding: 14px;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -webkit-flex-direction: column;
          -ms-flex-direction: column;
          flex-direction: column;
          -webkit-box-pack: justify;
          -webkit-justify-content: space-between;
          -ms-flex-pack: justify;
          justify-content: space-between;
          -webkit-box-align: center;
          -webkit-align-items: center;
          -ms-flex-align: center;
          align-items: center;
        `}
      >
        <Image />
      </div>
    </div>
  )
}

const CategoriesItem = ({ id, thumbUrl, name, onOpenItemClick, isMyData }) => {
  const { myDataContains, myName, isMyItemOpened, onDragStart } = useContext(Context)

  return (
    <div
      onClick={onOpenItemClick}
      draggable={isMyItemOpened}
      ondragstart={() => onDragStart(id)}
      class={css`
        position: relative;
        height: 250px;
        max-height: 250px;
        overflow: hidden;
        border-radius: 15px;
        cursor: ${isMyItemOpened ? "initial" : "pointer"};

        &:first-child {
          margin-left: 0;
        }
        ${slideMenuParentCSS}
      `}
    >
      <SlideMenu id={id} borderRadius={15} />
      <Heart id={id} />

      <div
        class={classNames(
          css`
            position: absolute;
            height: 250px;
            width: 100%;
            background-position: ${isMyData ? "right" : "center"};
            background-size: cover;
            background-repeat: no-repeat;
          `,
          {
            [css`
              //TODO: add condition
              transition: all 3s;
              &:hover,
              &:focus {
                transform: scale(1.3);
              }
            `]: isBrowser && !isMyData && myName !== "environment",
          }
        )}
        style={{
          backgroundImage: `url(${thumbUrl})`,
        }}
      />
      <div
        class={css`
          position: absolute;
          bottom: 0;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          flex: 0 auto;
          width: 100%;
          height: 40px;
          margin: 0;
          padding: 0;
          padding-left: 5%;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          background-color: rgba(18, 20, 27, 0.75);
          cursor: pointer;
        `}
      >
        <div
          class={css`
            flex: 1;
            color: #95bff6;
            font-size: 16px;
            font-weight: 200;
            text-transform: capitalize;
          `}
        >
          {name}
        </div>
      </div>
    </div>
  )
}

const LottieItem = ({ id, url, name }) => {
  const { isMyItemOpened, onAddToMyClick, onDragStart } = useContext(Context)

  return (
    <div
      draggable={isMyItemOpened}
      ondragstart={() => onDragStart(id)}
      class={css`
        position: relative;
        margin-bottom: 0px;

        height: 100%;
        width: 100%;
        cursor: "pointer";

        ${slideMenuParentCSS}
      `}
      onClick={(e) => onAddToMyClick(e, id)}
    >
      <SlideMenu id={id} borderRadius={6} />
      <Heart id={id} />

      <Lottie
        style={{ height: "400px" }}
        path={url}
        class={css`
          display: flex;
          align-items: center;
          justify-content: center;
          height: 90%;

          border-style: solid;
          border-width: 1px;
          border-color: #1c1f2a;
          background-color: transparent;

          & > svg {
            display: block;
          }
        `}
        loop
        play
      />
      <div
        class={css`
          display: flex;
          align-items: center;
          height: 25px;
          padding-left: 10px;
          align-items: center;
          border-style: none solid solid;
          border-width: 1px;
          border-color: rgba(0, 0, 0, 0.2);
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
          background-color: #1c1f2a;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
          color: #6c8db8;
          font-size: 12px;
          line-height: 12px;
          font-weight: 200;
          white-space: nowrap;
        `}
      >
        {name}
      </div>
    </div>
  )
}

const Audio = ({ id, name, src }) => {
  const player = useRef()
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState("00:00")
  const { myDataContains, onAddToMyClick, isMyItemOpened, onDragStart } = useContext(Context)
  return (
    <div
      draggable={isMyItemOpened}
      ondragstart={() => onDragStart(id)}
      onClick={(e) => onAddToMyClick(e, id)}
      class={classNames(
        "player",
        css`
          position: relative;
          display: flex;
          height: 40px;
          margin-top: 0px;
          padding-right: 15px;
          padding-left: 15px;
          -webkit-box-pack: justify;
          justify-content: space-between;
          -webkit-box-align: center;
          align-items: center;
          border-top: 1px none rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 0px;
          background-color: transparent;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
            Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
          font-size: 12px;
          cursor: pointer;

          &:hover {
            background-color: #12141b;
          }
        `
      )}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          playing ? setPlaying(false) : setPlaying(true)
        }}
        class={css`
          cursor: pointer;
        `}
      >
        {playing ? (
          <div
            class={css`
              display: flex;
              width: 12px;
              height: 12px;
              justify-content: center;
              -webkit-box-align: center;
              align-items: center;
              flex: 0 0 auto;
              border-style: solid;
              border-width: 1px;
              border-color: #6c8db8;
              border-radius: 3px;
              background-color: #6c8db8;
            `}
          />
        ) : (
          <img
            src="https://assets.website-files.com/616a041ea72c58e139ed3c8e/616a041ea72c582627ed3cb0_iconfinder-icon%20(3).svg"
            width="9"
          />
        )}
      </div>
      <div
        class={css`
          padding-left: 15px;
          flex-grow: 1;
        `}
      >
        {name}
      </div>
      <div>{duration}</div>
      <Heart id={id} audio={true} />
      <ReactHowler
        onLoad={() => {
          setDuration(dayjs(player.current.duration() * 1000).format("mm:ss.SSS"))
        }}
        onEnd={() => {
          setPlaying(false)
        }}
        onStop={() => {
          setPlaying(false)
        }}
        ref={player}
        src={src}
        preload={false}
        html5={true}
        playing={playing}
      />
    </div>
  )
}

const Unsplash = ({}) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [error, setError] = useState()
  const [query, setQuery] = useState("")
  const debouncedSetQuery = useDebouncedCallback((value) => setQuery(value), 1000)
  const { addingToMy, uploadToMy } = useContext(Context)

  var unsplashID = "7uvLOvcJobn4kUszQ-ftApVAtjbt1wvq1oJTgKBlbPc"
  const getUrl = () => {
    const page = !items.length ? 1 : items.length / 20
    if (query)
      return `https://api.unsplash.com/search/photos?client_id=${unsplashID}&query=${query}&page=${page}&per_page=20`
    return `https://api.unsplash.com/photos?client_id=${unsplashID}&page=${page}&per_page=20`
  }

  const loadMore = (isNewQuery) => {
    setLoading(true)
    $.get(getUrl(), (data) => {
      data = query ? data.results : data
      isNewQuery ? setItems(data) : setItems((prev) => [...prev, ...data])
      setHasNextPage(true)
      setLoading(false)
      //        setError(err)
    })
  }

  useEffect(() => {
    loadMore(true)
  }, [query])

  const [infiniteRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
    disabled: !!error,
    // `rootMargin` is passed to `IntersectionObserver`.
    // We can use it to trigger 'onLoadMore' when the sentry comes near to become
    // visible, instead of becoming fully visible on the screen.
    rootMargin: "0px 0px 400px 0px",
  })

  return (
    <div>
      <div
        class={css`
          padding-top: 42px;
          margin-bottom: 10px;
        `}
      >
        <input
          type="text"
          placeholder={"Search Unsplash"}
          onChange={(e) => debouncedSetQuery(e.target.value)}
          class={classes.searchInput}
        />
      </div>

      <Masonry
        breakpointCols={breakpointColumnsObj}
        className={css`
          display: flex;
          margin-left: -30px; /* gutter size offset */
          width: auto;
        `}
        columnClassName={css`
          padding-left: 30px; /* gutter size */
          background-clip: padding-box;
          & > div {
            // background: grey;
            margin-bottom: 30px;
          }
        `}
      >
        {items.map((item) => {
          return (
            <div
              class={css`
                cursor: pointer;
                position: relative;
              `}
            >
              {addingToMy(item.id) && <Spinner isMasonry={true} />}

              <img
                key={item.id}
                onClick={(e) => uploadToMy(e, "Image", item.urls.regular, item.id)}
                src={item.urls.regular}
                // loading="lazy"
                class={css`
                  ${addingToMy(item.id) && "visibility: hidden;"}
                `}
              >
                {item.name}
              </img>
            </div>
          )
        })}
        )}
      </Masonry>

      {hasNextPage && <div ref={infiniteRef}>Loading...</div>}
    </div>
  )
}

const Pixabay = ({}) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [error, setError] = useState()
  const [query, setQuery] = useState("")
  const debouncedSetQuery = useDebouncedCallback((value) => setQuery(value), 1000)
  const { addingToMy, uploadToMy } = useContext(Context)

  var pixabayKey = "15962911-94d039aef78b595bfb0bf5385"
  const loadMore = (isNewQuery) => {
    setLoading(true)
    const page = !items.length ? 1 : items.length / 20
    const url = `https://pixabay.com/api/videos/?key=${pixabayKey}&q=${query}&page=${page}`
    $.get(url, (data) => {
      data = data.hits.map(({ id, picture_id, videos, user }) => {
        return {
          id,
          thumb: `https://i.vimeocdn.com/video/${picture_id}_295x166.jpg`,
          url: videos.tiny.url,
          name: user + "_" + id,
        }
      })

      isNewQuery ? setItems(data) : setItems((prev) => [...prev, ...data])
      setHasNextPage(true)
      setLoading(false)
      // setError(err)
    })
  }

  useEffect(() => {
    loadMore(true)
  }, [query])

  const [infiniteRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
    disabled: !!error,
    // `rootMargin` is passed to `IntersectionObserver`.
    // We can use it to trigger 'onLoadMore' when the sentry comes near to become
    // visible, instead of becoming fully visible on the screen.
    rootMargin: "0px 0px 400px 0px",
  })

  return (
    <div>
      <div
        class={css`
          padding-top: 42px;
          margin-bottom: 10px;
        `}
      >
        <input
          type="text"
          placeholder={"Search Pixabay"}
          onChange={(e) => debouncedSetQuery(e.target.value)}
          class={classes.searchInput}
        />
      </div>

      <div
        class={css`
          display: grid;
          --n: 4;
          grid-template-columns: repeat(auto-fill, minmax(max(200px, 100% / var(--n)), 1fr));
          grid-gap: 20px;
          margin-top: 20px;
        `}
      >
        {items.map(({ id, thumb, url, name }) => {
          if (url.indexOf("/progressive_redirect/") > 0) return

          if (addingToMy(id)) {
            return <Spinner />
          }
          return (
            <PixabayVideo
              name={name}
              onUploadToMyClick={(e) => uploadToMy(e, "Video", url, id)}
              id={id}
              thumb={thumb}
              url={url}
            />
          )
        })}
      </div>

      {hasNextPage && <div ref={infiniteRef}>Loading...</div>}
    </div>
  )
}

const PixabayVideo = ({ id, url, thumb, onUploadToMyClick, name }) => {
  const [preview, setPreview] = useState(false)
  const [initialPreview, setInitialPreview] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { isMyItemOpened, onDragStart } = useContext(Context)

  const class_ = css`
    width: 100%;
    cursor: pointer;
  `
  return (
    <div
      key={id}
      onClick={(e) => onUploadToMyClick(e)}
      draggable={isMyItemOpened}
      ondragstart={() => onDragStart(id)}
      onMouseEnter={() => {
        setInitialPreview(true)
        setPreview(true)
      }}
      onMouseLeave={() => setPreview(false)}
    >
      <div
        class={css`
          border-radius: 15px;
          overflow: hidden;
          ${slideMenuParentCSS}
        `}
      >
        <SlideMenu id={id} />
        <Heart id={id} />

        {initialPreview && (
          <video
            onloadeddata={() => setLoaded(true)}
            style={{ display: preview && loaded ? "block" : "none" }}
            class={class_}
            src={url}
            autoplay
            muted
          />
        )}

        {thumb ? (
          <img
            class={class_}
            loading="lazy"
            style={{ display: preview && loaded ? "none" : "block" }}
            src={thumb}
          />
        ) : (
          <video
            style={{ display: preview && loaded ? "none" : "block" }}
            class={class_}
            src={url + "#t=0.1"}
            preload="metadata"
            muted
          />
        )}
      </div>
      <div
        class={css`
          padding-top: 10px;
          color: #95bff6;
          font-family: Exo, sans-serif;
          font-size: 16px;
          font-weight: 200;
          white-space: nowrap;
          text-transform: capitalize;
          vertical-align: middle;
        `}
      >
        {name}
      </div>
    </div>
  )
}

class Menu extends Component {
  render({ onClick, portalMenu, activeItem }, {}) {
    return (
      <div
        class={css`
          display: flex;
        `}
      >
        {portalMenu &&
          menuItems.map((i) => {
            return (
              <div
                onClick={() => onClick(i)}
                className={classNames(
                  "tab-item",
                  "portal-item",
                  {
                    active: activeItem === i.name,
                  },
                  "show",
                  css`
                    position: relative;
                    top: 5px;
                    text-transform: capitalize;
                  `
                )}
                key={i.name}
              >
                <span class="text">{i.name}</span>
              </div>
            )
          })}
      </div>
    )
    return
  }
}

const classes = {
  accordionTitle: css`
    display: flex;
    width: 100%;
    padding-top: 3px;
    align-self: center;
    flex: 1;
    color: #95bff6;
    font-size: 16px;
    font-weight: 200;
    white-space: nowrap;
  `,
  searchInput: css`
    flex: 1;
    font-size: 18px;
    font-weight: 200;
    padding-left: 40px;
    color: #6c8db8;
    cursor: pointer;
    outline: 0;
    border: 1px solid rgba(76, 110, 147, 0.32);
    height: 60px;
    line-height: 60px;
    width: 100%;
    color: #6c8db8;
    font-size: 18px;
    font-weight: 100;
    background: url("https://assets.website-files.com/616a041ea72c58e139ed3c8e/616a041ea72c58e49bed3cf1_Engine-icons-search_icon.svg")
      no-repeat left;
    background-size: 20px;
    background-position: 12px;

    &::placeholder {
      /* Chrome, Firefox, Opera, Safari 10.1+ */
      color: #6c8db8;
      opacity: 1; /* Firefox */
    }
  `,
}

const Spinner = ({ size = 10, isMasonry }) => {
  const borderSize = (1.1 / 10) * size

  return (
    <div
      class={css`
        &,
        &:after {
          border-radius: 50%;
          width: ${size}em;
          height: ${size}em;
        }
        & {
          margin: auto;
          font-size: 10px;
          ${isMasonry
            ? `
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          `
            : `position: relative;`}

          text-indent: -9999em;
          border-top: ${borderSize}em solid rgba(255, 255, 255, 0.2);
          border-right: ${borderSize}em solid rgba(255, 255, 255, 0.2);
          border-bottom: ${borderSize}em solid rgba(255, 255, 255, 0.2);
          border-left: ${borderSize}em solid #ffffff;
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-animation: load8 1.1s infinite linear;
          animation: load8 1.1s infinite linear;
        }
        @-webkit-keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
        @keyframes load8 {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
      `}
    />
  )
}

const InlineEdit = ({ value, setValue, forceReadOnly }) => {
  const [readOnly, setReadOnly] = useState(true)
  const [editingValue, setEditingValue] = useState(value)

  const onChange = (event) => setEditingValue(event.target.value)

  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.target.blur()
    }
  }

  const onBlur = (event) => {
    if (event.target.value.trim() === "") {
      setEditingValue(value)
    } else {
      setValue(event.target.value)
    }

    setReadOnly(true)
  }

  const onDoubleClick = (e) => {
    e.stopPropagation()
    setReadOnly(false)
  }

  return (
    <input
      type="text"
      value={editingValue}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      readOnly={forceReadOnly || readOnly}
      class={classes.accordionTitle}
      onDoubleClick={onDoubleClick}
      style={{ cursor: readOnly ? "pointer" : "" }}
    />
  )
}

const parseData = (data) => {
  if (Array.isArray(data)) return data

  let newData = []

  for (const [k1, v1] of Object.entries(data)) {
    const r1 = { name: k1, id: v1.id, thumbUrl: v1.thumbUrl, items: [] }

    for (const [k2, v2] of Object.entries(v1.children)) {
      const r2 = { name: k2, id: v2.id, url: v2.url, thumbUrl: v2.thumbUrl }

      if (v2.children) {
        r1.accordion = true
        r2.items = []
        for (const [k3, v3] of Object.entries(v2.children)) {
          const r3 = { id: v3.id, name: k3, url: v3.url, thumbUrl: v3.thumbUrl }

          if (v3.children) {
            r2.accordion = true
            r3.items = []
            for (const [k4, v4] of Object.entries(v3.children)) {
              const r4 = { name: k4, id: v4.id, url: v4.url, thumbUrl: v4.thumbUrl }
              r3.items.push(r4)
            }
          }
          r2.items.push(r3)
        }
      }

      r1.items.push(r2)
    }

    newData.push(r1)
  }

  return newData
}

const menuItems = [
  { name: projectsInitItem },
  { name: "geometry", myName: "geometry", url: "/asset/geometry/list", exts: ["obj", "fbx"] },
  { name: "materials", myName: "material", url: "/asset/material/list", exts: ["obj", "fbx"] },
  { name: "images", myName: "image", url: "/asset/image/list", exts: ["obj", "fbx"] },
  { name: "audio", myName: "audio", url: "/asset/audio/list", exts: ["obj", "fbx"] },
  { name: "video", myName: "video", exts: ["obj", "fbx"] },
  { name: "animation", myName: "animation", url: "/asset/animation/list", exts: ["obj", "fbx"] },
  {
    name: "environment",
    myName: "environment",
    url: "/asset/environment/list",
    exts: ["obj", "fbx"],
  },
]

class MenuPortal extends Component {
  constructor(props) {
    super(props)
    this.el = document.createElement("div")
    this.portal = document.getElementById("portal")
  }
  componentDidMount() {
    this.portal.appendChild(this.el)
  }
  componentWillUnmount() {
    this.portal.removeChild(this.el)
  }
  render() {
    return createPortal(this.props.children, this.el)
  }
}

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
}

const insert = (arr, index, newItem) => [
  // part of the array before the specified index
  ...arr.slice(0, index),
  // inserted item
  newItem,
  // part of the array after the specified index
  ...arr.slice(index),
]
render(<Tabs />, document.getElementById("tab-assets"))

if (module.hot) {
  module.hot.accept()
}
