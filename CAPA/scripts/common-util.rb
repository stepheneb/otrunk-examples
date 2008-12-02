def toPlainText(xhtmlText)
  return xhtmlText.gsub(/<.*?>/, '').strip().squeeze()
end
