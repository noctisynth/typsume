#let colors = json("cfg_colors.json")
#let fonts  = json("cfg_fonts.json")
#let sizes  = json("cfg_sizes.json")
#let data   = json("resume.json")

#let rgb_of(c) = rgb(c)

#let icon(path, width: 0.9em, height: 0.8em) = box(
  text(fill: rgb_of(colors.icon), image(path, alt: path)),
  width: width, height: height,
)

#let icons = (
  fa-angle-right: icon("icons/fa-angle-right.svg"),
  fa-award: icon("icons/fa-award.svg"),
  fa-wrench: icon("icons/fa-wrench.svg"),
  fa-graduation-cap: icon("icons/fa-graduation-cap.svg"),
  fa-work: icon("icons/fa-work.svg"),
  fa-code: icon("icons/fa-code.svg"),
)

#let resume(font-size: 10pt, margin: (top: 1.5cm, bottom: 1.5cm, left: 1.5cm, right: 1.5cm), gutter-width: 2em, photo: none, header, body) = {
  set page(paper: "a4", numbering: none, margin: margin)
  set text(font: (fonts.main, fonts.mono), fill: rgb_of(colors.main), size: font-size, lang: "zh")
  show heading: set text(size: sizes.heading * 1pt, fill: rgb_of(colors.theme))
  show heading.where(level: 2): it => stack(
    v(0.1em), it, v(0.4em),
    line(length: 100%, stroke: 0.05em + rgb_of(colors.theme)),
  )
  show list: set text(fill: rgb_of(colors.main), size: sizes.list * 1pt)
  set list(indent: 0.8em, body-indent: 0.3em, marker: icons.fa-angle-right)
  show link: underline
  show link: set text(fill: rgb_of(colors.link))
  set par(first-line-indent: 0em, spacing: 0.6em, justify: true)
  grid(
    columns: (1fr, 12em),
    gutter: (gutter-width, auto),
    [#body],
    { header },
  )
}

#let sidebar(side, content, with-line: true, side-width: 13%) = layout(size => {
  let side-size = measure(side, height: size.height, width: size.width)
  let content-size = measure(content, width: size.width * (100% - side-width), height: size.height)
  let height = calc.max(side-size.height, content-size.height) + 0.5em
  grid(
    columns: (side-width, 0%, auto),
    gutter: 0.6em,
    { v(0.25em); side; v(0.25em) },
    if with-line { line(end: (0em, height), stroke: 0.05em) },
    { v(0.25em); content; v(0.25em) },
  )
})

#let info(color: black, ..infos) = {
  set text(font: (fonts.mono, fonts.main), fill: color)
  set par(justify: false)
  infos.pos().map(item => {
    box({
      item.icon
      h(0.5em)
      if "link" in item {
        link(item.link, item.content)
      } else {
        item.content
      }
      v(0.5em)
    })
  }).join()
  v(0.5em)
}

#let secondary(body) = text(fill: rgb_of(colors.secondary), body)

#let date(body) = text(fill: rgb_of(colors.secondary), size: 0.8em, body)
#let tech(body) = block({ set text(size: sizes.list * 1pt, weight: "extralight"); body; v(0.2em) })
#let item(title, desc, endnote) = {
  v(0.7em)
  grid(
    columns: (39%, 1fr, auto),
    gutter: 0em,
    text(title, size: sizes.item_title * 1pt), text(desc, fill: rgb_of(colors.secondary)), endnote,
  )
}
#let space-between(..items) = {
  let items_arr = items.pos()
  let len = items_arr.len()
  let columns = items_arr.map(item => 100% / len)
  set text(size: sizes.list * 1pt)
  v(0.2em)
  grid(
    columns: columns,
    align: items_arr.map(item => {
      if item == items_arr.first() { left }
      else if item == items_arr.last() { right }
      else { center }
    }),
    gutter: 0em,
    ..items,
  )
  v(0.3em)
}
#let proficiency(level) = {
  set text(size: sizes.list * 1pt)
  sub(text(level, fill: rgb_of(colors.secondary)))
}
#let tech-stack(level: "精通", ..techs) = {
  techs.pos().map(item => text(item, size: 7.5pt, weight: "bold")).join(" / ")
  proficiency(level)
}

#let photo = data.basics.at("photo", default: none)
#let contacts = data.basics.contacts

#let header = [
  #set align(right)
  = [#data.basics.name]
  #h(0.5em)
  #set align(left)
  #if contacts.len() > 0 [
    #info(
      color: rgb_of(colors.theme),
      ..contacts.map(c => {
        let icon-key = "fa-" + c.at("icon", default: "envelope")
        let text-val = c.at("text", default: "")
        let link-val = c.at("link", default: none)
        (
          icon: icons.at(icon-key, default: icons.fa-award),
          content: text-val,
          link: link-val,
        )
      }),
    )
  ]
  == #icons.fa-wrench 技术栈
  #for section in data.skills [
    #tech[ #section.name ]
    #list(..section.items.map(item => {
      let level = item.at("level", default: "熟悉")
      [- #tech-stack(level: level, item.name)]
    }))
  ]
  == #icons.fa-award 荣誉
  #sidebar(
    stack(
      for a in data.awards [
        #linebreak()
        #linebreak()
        #v(0.8em)
        #text(size: 0.7em, a.date)
      ]
    ),
    stack(
      for a in data.awards [
        #text(size: 0.7em, a.title)
        #linebreak()
      ]
    ),
  )
]

#let body = [
  == #icons.fa-code 项目经历
  #for it in data.projects [
    #item(
      {
        let links = it.at("links", default: ())
        if links.len() > 0 {
          let first = links.at(0)
          link(first.href, [* #it.title *])
        } else {
          [* #it.title *]
        }
      },
      [* #(it.at("subtitle", default: "")) *],
      if it.at("period", default: none) != none [ #date(it.period) ],
    )
    #let stack-tags = it.at("stack", default: ())
    #if stack-tags.len() > 0 [
      #tech[ #stack-tags.join(" ") ]
    ]
    #if it.at("body", default: none) != none [ #(it.body) ]
    #let highlights = it.at("highlights", default: ())
    #if highlights.len() > 0 [
      #list(..highlights.map(h => [- #h]))
    ]
  ]
  == #icons.fa-work 实习经历
  #for it in data.experience [
    #item(
      {
        let links = it.at("links", default: ())
        if links.len() > 0 {
          let first = links.at(0)
          link(first.href, [* #it.title *])
        } else {
          [* #it.title *]
        }
      },
      [* #(it.at("subtitle", default: "")) *],
      if it.at("period", default: none) != none [ #date(it.period) ],
    )
    #let stack-tags = it.at("stack", default: ())
    #if stack-tags.len() > 0 [
      #tech[ #stack-tags.join(" ") ]
    ]
    #if it.at("body", default: none) != none [ #(it.body) ]
    #let highlights = it.at("highlights", default: ())
    #if highlights.len() > 0 [
      #list(..highlights.map(h => [- #h]))
    ]
  ]
  == #icons.fa-graduation-cap 教育背景
  #for it in data.education [
    #space-between(
      [* #it.title * #if it.at("subtitle", default: none) != none [ - #it.subtitle ]],
      if it.at("period", default: none) != none [ #date(it.period) ],
    )
    #let highlights = it.at("highlights", default: ())
    #if highlights.len() > 0 [
      #list(..highlights.map(h => [- #h]))
    ]
  ]
]

#resume(
  font-size: sizes.font * 1pt,
  photo: photo,
  header,
  body,
)
