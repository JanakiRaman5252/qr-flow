import { describe, it, expect } from 'vitest'

describe('Folder and Tag Utility Logic', () => {
  it('sanitizes tag names correctly by removing spaces', () => {
    const rawTag = 'Summer Sale 2026'
    const cleanTag = rawTag.replace(/\s+/g, '')
    expect(cleanTag).toBe('SummerSale2026')
  })

  it('assigns fallback folder color if empty', () => {
    const customColor = ''
    const defaultFolderColor = customColor || '#6366F1'
    expect(defaultFolderColor).toBe('#6366F1')
  })

  it('assigns fallback tag color if empty', () => {
    const customColor = ''
    const defaultTagColor = customColor || '#EC4899'
    expect(defaultTagColor).toBe('#EC4899')
  })

  it('filters QR items by folderId correctly', () => {
    const qrCodes = [
      { id: '1', title: 'QR 1', folderId: 'f1' },
      { id: '2', title: 'QR 2', folderId: 'f2' },
      { id: '3', title: 'QR 3', folderId: null },
    ]

    const filteredF1 = qrCodes.filter((qr) => qr.folderId === 'f1')
    expect(filteredF1.length).toBe(1)
    expect(filteredF1[0].id).toBe('1')

    const filteredUnassigned = qrCodes.filter((qr) => qr.folderId === null)
    expect(filteredUnassigned.length).toBe(1)
    expect(filteredUnassigned[0].id).toBe('3')
  })

  it('filters QR items by tagId correctly', () => {
    const qrCodes = [
      { id: '1', title: 'QR 1', tags: [{ tagId: 't1' }, { tagId: 't2' }] },
      { id: '2', title: 'QR 2', tags: [{ tagId: 't2' }] },
      { id: '3', title: 'QR 3', tags: [] },
    ]

    const filteredT1 = qrCodes.filter((qr) => qr.tags.some((t) => t.tagId === 't1'))
    expect(filteredT1.length).toBe(1)

    const filteredT2 = qrCodes.filter((qr) => qr.tags.some((t) => t.tagId === 't2'))
    expect(filteredT2.length).toBe(2)
  })
})
