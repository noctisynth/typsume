#let colors = json("cfg_colors.json")
#let fonts  = json("cfg_fonts.json")
#let sizes  = json("cfg_sizes.json")
#let layout_cfg = json("cfg_layout.json")
#let data   = json("resume.json")

#let rgb_of(c) = rgb(c)
#let length_of(value) = eval(value, mode: "code")

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

#let resume(font-size: 10pt, margin: (top: 1.5cm, bottom: 1.5cm, left: 1.5cm, right: 1.5cm), gutter-width: 2em, side-width: 12em, photo: none, header, body) = {
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
    columns: (auto, side-width),
    gutter: (gutter-width, auto),
    [#body],
    {
      if photo != none {
        set align(center)
        image(photo, alt: "Profile Image", width: side-width)
      }
      header
    },
  )
}

#let info(color: black, ..infos) = {
  set text(font: (fonts.mono, fonts.main), fill: color)
  set par(justify: false)
  infos.pos().map(item => {
    box({
      item.icon
      h(0.5em)
      let item-link = item.at("link", default: none)
      if item-link != none {
        link(item-link, item.content)
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
    columns: (1.2fr, 1fr, auto),
    gutter: 0.8em,
    text(title, size: sizes.item_title * 1pt),
    text(desc, fill: rgb_of(colors.secondary)),
    endnote,
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

#let photo-value = data.basics.at("photo", default: none)
#let photo = if photo-value == none or photo-value == "" { none } else { photo-value }
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
  #let award-dates = ()
  #for award in data.awards {
    if not award-dates.contains(award.date) {
      award-dates.push(award.date)
    }
  }
  #for award-date in award-dates [
    #let grouped-awards = data.awards.filter(award => award.date == award-date)
    #grid(
      columns: (3.2em, 0.5em, 1fr),
      gutter: 0.4em,
      align: (right + top, center + top, left + top),
      text(size: 0.7em, fill: rgb_of(colors.secondary), award-date),
      circle(radius: 0.12em, fill: rgb_of(colors.theme)),
      stack(
        spacing: 0.25em,
        ..grouped-awards.map(award => [
          #text(size: 0.7em, award.title)
          #if award.at("level", default: none) != none [
            #h(0.3em)
            #text(size: 0.65em, fill: rgb_of(colors.secondary), award.level)
          ]
        ]),
      ),
    )
    #v(0.45em)
  ]
]

#let body = [
  == #icons.fa-code 项目经历
  #for it in data.projects [
    #item(
      {
        let links = it.at("links", default: ())
        if links.len() > 0 {
          let first = links.at(0)
          link(first.href, strong(it.title))
        } else {
          strong(it.title)
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
          link(first.href, strong(it.title))
        } else {
          strong(it.title)
        }
      },
      [* #(it.at("subtitle", default: "")) *],
      if it.at("period", default: none) != none [ #date(it.period) ],
    )
    #let department = it.at("department", default: none)
    #if department != none [
      #tech[ #department ]
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
  margin: (
    top: length_of(layout_cfg.margin_top),
    bottom: length_of(layout_cfg.margin_bottom),
    left: length_of(layout_cfg.margin_left),
    right: length_of(layout_cfg.margin_right),
  ),
  gutter-width: length_of(layout_cfg.gutter_width),
  side-width: length_of(layout_cfg.side_width),
  photo: photo,
  header,
  body,
)
