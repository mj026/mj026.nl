import showdown from "showdown"

const converter = new showdown.Converter({
  extensions: [],
})
converter.setOption("parseImgDimensions", true)
converter.setOption("emoji", true)
converter.setOption("tables", true)
converter.setFlavor("github")
converter.setOption("openLinksInNewWindow", true)

export default (content: string) => {
  return converter.makeHtml(content)
}
